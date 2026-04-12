package com.example.mensfashionshop.chatbot.service;

import com.example.mensfashionshop.chatbot.dto.ChatRequest;
import com.example.mensfashionshop.chatbot.dto.ChatResponse;
import com.example.mensfashionshop.chatbot.dto.ProductChatItem;
import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import com.example.mensfashionshop.chatbot.entity.ChatUnresolved;
import com.example.mensfashionshop.chatbot.entity.ChatbotScenario;
import com.example.mensfashionshop.chatbot.repository.ChatConversationRepository;
import com.example.mensfashionshop.chatbot.repository.ChatMessageRepository;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import com.example.mensfashionshop.chatbot.repository.ChatbotScenarioRepository;
import com.example.mensfashionshop.product.entity.Product;
import com.example.mensfashionshop.product.repository.ProductRepository;
import com.example.mensfashionshop.user.entity.User;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatbotScenarioRepository scenarioRepository;
    private final ChatUnresolvedRepository unresolvedRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;


    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        System.out.println("AUTH = " + authentication);
        System.out.println("USERNAME = " + authentication.getName());

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    @Transactional
    public ChatResponse handleMessage(ChatRequest request) {
        String normalized = normalize(request.getMessage());

        String chatType = (request.getChatType() == null || request.getChatType().isBlank())
                ? "GENERAL"
                : request.getChatType().trim().toUpperCase();
        String effectiveChatType = chatType;

        String resolvedSessionCode = resolveSessionCode(request);

        ChatConversation conversation = conversationRepository.findBySessionCode(resolvedSessionCode)
                .orElseGet(() -> {
                    request.setSessionCode(resolvedSessionCode);
                    return createConversation(request, chatType);
                });

        // cập nhật ngữ cảnh hiện tại nếu user đang tư vấn theo sản phẩm
        if ("PRODUCT".equals(effectiveChatType) && request.getProductId() != null) {
            conversation.setChatType("PRODUCT");
            conversation.setProductId(request.getProductId());
            conversationRepository.save(conversation);
        }

        String requestedKeyword = detectProductKeyword(normalized);
        boolean productInfoQuestion = isProductInfoQuestion(normalized);

        // Nếu user đang ở ngữ cảnh sản phẩm nhưng hỏi sang danh mục khác
        if (conversation.getProductId() != null && requestedKeyword != null && !productInfoQuestion) {
            conversation.setProductId(null);
            conversation.setChatType("GENERAL");
            conversationRepository.save(conversation);

            effectiveChatType = "GENERAL";
        }

        ChatMessage customerMessage = saveCustomerMessage(conversation, request.getMessage());

        // 1. Nếu vừa mở chat từ sản phẩm mà chưa nhập gì
        if ("PRODUCT".equals(effectiveChatType) && request.getProductName() != null
                && (request.getMessage() == null || request.getMessage().isBlank())) {

            ChatResponse response = buildResponse(
                    conversation,
                    "Bạn cần tư vấn gì với mẫu " + request.getProductName()
                            + "? Mình có thể hỗ trợ về size, giá, màu sắc, chất liệu, mô tả hoặc tình trạng còn hàng nhé.",
                    false,
                    "TEXT",
                    null,
                    buildProductMetadataFromRequest(request)
            );
            saveBotMessage(conversation, response.getMessage());
            return response;
        }

        // 2. Tìm / xem thêm danh sách sản phẩm trước
        Optional<ChatResponse> productListResponse = handleProductSearch(normalized, conversation);
        if (productListResponse.isPresent()) {
            ChatResponse response = productListResponse.get();
            saveBotMessage(conversation, response.getMessage());
            return response;
        }

        // 3. Nếu user hỏi thông tin sản phẩm chung chung nhưng chưa chọn sản phẩm nào
        Long activeProductId = request.getProductId();

        if (activeProductId == null
                && "PRODUCT".equals(chatType)
                && conversation.getProductId() != null) {
            activeProductId = conversation.getProductId();
        }

        if (isProductInfoQuestion(normalized) && activeProductId == null) {
            String reply = "Bạn hãy lựa chọn một mặt hàng nào đó trước nhé, rồi mình sẽ tư vấn size, giá, màu sắc, chất liệu hoặc tình trạng còn hàng cho bạn.";

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("suggestions", List.of("cà vạt", "áo sơ mi"));

            saveBotMessage(conversation, reply);

            return buildResponse(
                    conversation,
                    reply,
                    false,
                    "SUGGESTION",
                    null,
                    metadata
            );
        }

        // 4. Ưu tiên kịch bản cố định (FAQ, shop info,...)
        List<ChatbotScenario> scenarios = scenarioRepository.findByActiveTrue();
        for (ChatbotScenario scenario : scenarios) {

            if (isAskingMoreProducts(normalized)) continue;

            if (matchesScenario(normalized, scenario)) {

                // 🔥 reset luôn context sản phẩm
                conversation.setProductId(null);
                conversation.setChatType("GENERAL");
                conversationRepository.save(conversation);

                ChatResponse response = buildScenarioResponse(scenario, conversation);
                saveBotMessage(conversation, response.getMessage());
                return response;
            }
        }

        // 5. Nếu không phải tìm danh mục mới thì mới xử lý theo sản phẩm cũ

        if ("PRODUCT".equals(effectiveChatType) && activeProductId != null) {
            Optional<ChatResponse> productContextResponse = handleProductContext(normalized, activeProductId, conversation);
            if (productContextResponse.isPresent()) {
                ChatResponse response = productContextResponse.get();
                saveBotMessage(conversation, response.getMessage());
                return response;
            }
        }

        // reset trạng thái phân trang nếu người dùng chuyển chủ đề
        if (!isAskingMoreProducts(normalized)) {
            resetProductSearchState(conversation);
        }

        // 6. Fallback
        String fallback = "Sẽ có người hỗ trợ bạn sớm nhất nhé!";
        saveBotMessage(conversation, fallback);
        saveUnresolved(conversation, customerMessage);

        return buildResponse(
                conversation,
                fallback,
                true,
                "TEXT",
                null,
                null
        );
    }

    private Map<String, Object> buildProductMetadataFromRequest(ChatRequest request) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("productId", request.getProductId());
        metadata.put("productName", request.getProductName());
        return metadata;
    }

    private ChatConversation createConversation(ChatRequest request, String chatType) {
        ChatConversation newConversation = new ChatConversation();
        User currentUser = getCurrentUser();

        String sessionCode = resolveSessionCode(request);

        newConversation.setCustomer(currentUser);
        newConversation.setSessionCode(sessionCode);
        newConversation.setStatus("OPEN");
        newConversation.setStartedAt(LocalDateTime.now());
        newConversation.setChatType(chatType);
        newConversation.setProductId(request.getProductId());
        newConversation.setLastProductKeyword(null);
        newConversation.setLastProductOffset(0);

        return conversationRepository.save(newConversation);
    }

    private ChatMessage saveCustomerMessage(ChatConversation conversation, String message) {
        ChatMessage customerMessage = new ChatMessage();
        customerMessage.setConversation(conversation);
        customerMessage.setSenderType("CUSTOMER");
        customerMessage.setMessage(message);
        customerMessage.setCreatedAt(LocalDateTime.now());
        return messageRepository.save(customerMessage);
    }

    private void saveBotMessage(ChatConversation conversation, String message) {
        ChatMessage botMessage = new ChatMessage();
        botMessage.setConversation(conversation);
        botMessage.setSenderType("BOT");
        botMessage.setMessage(message);
        botMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(botMessage);
    }

    private void saveUnresolved(ChatConversation conversation, ChatMessage customerMessage) {
        ChatUnresolved unresolved = new ChatUnresolved();
        unresolved.setConversation(conversation);
        unresolved.setCustomerMessage(customerMessage);
        unresolved.setStatus("PENDING");
        unresolved.setCreatedAt(LocalDateTime.now());
        unresolvedRepository.save(unresolved);
    }

    private Optional<ChatResponse> handleProductContext(String normalizedMessage, Long productId, ChatConversation conversation) {

        Optional<Product> productOptional = productRepository.findById(productId);
        if (productOptional.isEmpty()) {
            return Optional.of(buildResponse(
                    conversation,
                    "Mình chưa tìm thấy thông tin sản phẩm này.",
                    true,
                    "TEXT",
                    null,
                    null
            ));
        }

        Product product = productOptional.get();

        if (containsAny(normalizedMessage,
                "tu van", "tu van gi", "tu van san pham", "hoi", "ho tro", "giup toi")) {

            return Optional.of(buildResponse(
                    conversation,
                    "Bạn cần tư vấn gì với mẫu " + product.getName()
                            + "? Mình có thể hỗ trợ:\n"
                            + "- Size\n"
                            + "- Giá\n"
                            + "- Màu sắc\n"
                            + "- Chất liệu\n"
                            + "- Còn hàng không\n"
                            + "- Mô tả chi tiết",
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        if (containsAny(normalizedMessage,
                "gia", "bao nhieu tien", "gia bao nhieu", "price", "cost")) {
            return Optional.of(buildResponse(
                    conversation,
                    "Sản phẩm " + product.getName() + " hiện có giá " + formatPrice(product.getPrice().doubleValue()) + ".",
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        SizeRecommendation recommendation = extractAndRecommendSize(normalizedMessage, product);

        if (recommendation != null) {
            if (recommendation.isAvailable()) {
                return Optional.of(buildResponse(
                        conversation,
                        "Với chiều cao " + recommendation.getHeightCm() + " cm và cân nặng " + recommendation.getWeightKg()
                                + " kg, size phù hợp với bạn là " + recommendation.getRecommendedSize() + ".",
                        false,
                        "PRODUCT_INFO",
                        null,
                        buildProductMetadata(product)
                ));
            }

            return Optional.of(buildResponse(
                    conversation,
                    "Không có size phù hợp với bạn.",
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        if (containsAny(normalizedMessage,
                "size", "con size", "size gi", "size nao", "co nhung size nao",
                "co bao nhieu size", "bao nhieu size", "kich co", "co nhung kich co nao")) {
            String sizes = safeValue(product.getSize(), "Shop đang cập nhật thông tin size của sản phẩm này.");
            return Optional.of(buildResponse(
                    conversation,
                    "Các size hiện có của " + product.getName() + " là: " + sizes + ". Nếu bạn muốn, mình có thể tư vấn size theo chiều cao và cân nặng luôn nhé.",
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        if (containsAny(normalizedMessage, "mau gi", "mau sac", "co mau nao", "co nhung mau nao", "color")) {
            String color = safeValue(product.getColor(), "Shop đang cập nhật màu sắc của sản phẩm này.");
            return Optional.of(buildResponse(
                    conversation,
                    "Sản phẩm " + product.getName() + " hiện có màu: " + color + ".",
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        if (containsAny(normalizedMessage, "mo ta", "chi tiet", "thong tin san pham", "san pham nay", "ao nay", "quan nay")) {
            String desc = safeValue(product.getDescription(), "Shop đang cập nhật mô tả sản phẩm.");
            return Optional.of(buildResponse(
                    conversation,
                    "Thông tin sản phẩm " + product.getName() + ": " + desc,
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        if (containsAny(normalizedMessage, "con hang", "het hang", "con khong", "stock")) {
            String stockMessage = product.getStock() != null && product.getStock() > 0
                    ? "Sản phẩm " + product.getName() + " hiện vẫn còn hàng."
                    : "Sản phẩm " + product.getName() + " hiện đang tạm hết hàng.";
            return Optional.of(buildResponse(
                    conversation,
                    stockMessage,
                    false,
                    "PRODUCT_INFO",
                    null,
                    buildProductMetadata(product)
            ));
        }

        return Optional.empty();
    }

    private Optional<ChatResponse> handleProductSearch(String normalizedMessage, ChatConversation conversation) {
        boolean askingMore = isAskingMoreProducts(normalizedMessage);

        String keyword = null;

        if (askingMore) {
            // ưu tiên keyword cũ
            if (conversation.getLastProductKeyword() != null && !conversation.getLastProductKeyword().isBlank()) {
                keyword = conversation.getLastProductKeyword();
            } else {
                // fallback nếu chưa có keyword
                keyword = detectProductKeyword(normalizedMessage);
            }
        } else {
            keyword = detectProductKeyword(normalizedMessage);
        }

        if (keyword == null || keyword.isBlank()) {
            return Optional.empty();
        }

        int offset = 0;

        if (askingMore && keyword.equalsIgnoreCase(safeValue(conversation.getLastProductKeyword(), ""))) {
            offset = conversation.getLastProductOffset() == null ? 0 : conversation.getLastProductOffset();
        } else {
            offset = 0;
            conversation.setLastProductKeyword(keyword);
            conversation.setLastProductOffset(0);
        }

        List<Product> products = searchProductsByKeyword(keyword, offset, 10);

        if (products.isEmpty()) {
            resetProductSearchState(conversation);
            conversationRepository.save(conversation);

            return Optional.of(buildResponse(
                    conversation,
                    "Đó là tất cả các mặt hàng của cửa hàng chúng tôi. Không biết bạn còn câu hỏi gì khác không?",
                    false,
                    "TEXT",
                    null,
                    null
            ));
        }

        List<ProductChatItem> items = products.stream()
                .map(this::mapToChatItem)
                .toList();

        int nextOffset = offset + 10;
        conversation.setLastProductKeyword(keyword);
        conversation.setLastProductOffset(nextOffset);
        conversationRepository.save(conversation);

        String message;
        if (offset == 0) {
            message = "Mình gợi ý cho bạn 10 sản phẩm " + keyword + " nè:";
        } else {
            message = "Đây là 10 sản phẩm " + keyword + " khác cho bạn tham khảo nè:";
        }

        return Optional.of(buildResponse(
                conversation,
                message,
                false,
                "PRODUCT_LIST",
                items,
                buildProductListMetadata(keyword, offset, nextOffset)
        ));
    }

    private void resetProductSearchState(ChatConversation conversation) {
        conversation.setLastProductKeyword(null);
        conversation.setLastProductOffset(0);
    }

    private List<Product> searchProductsByKeyword(String keyword, int offset, int limit) {
        int page = offset / limit;

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(
                        page,
                        limit,
                        org.springframework.data.domain.Sort.by("id").ascending()
                );

        List<Product> byName = productRepository.findByNameContainingIgnoreCase(keyword, pageable);
        if (!byName.isEmpty()) {
            return byName;
        }

        return productRepository.findByCategoryNameContainingIgnoreCase(keyword, pageable);
    }

    private boolean isAskingMoreProducts(String normalizedMessage) {
        return containsAny(normalizedMessage,
                "khac",
                "san pham khac",
                "xem them",
                "them nua",
                "con nua khong",
                "con khong",
                "goi y them",
                "cho toi them",
                "hien them",
                "them san pham",
                "mau khac",
                "mau moi",
                "them mau",
                "them mau moi",
                "mau nua",
                "con mau nao",
                "co mau nao khac",

                "so mi khac",
                "ao so mi khac",

                "polo khac",
                "ao polo khac",

                "quan khac",
                "them quan",
                "quan nua",

                "blazer khac",
                "them blazer",

                "giay khac",
                "them giay",

                "ca vat khac",
                "them ca vat",
                "caravat khac",
                "them caravat"
        );
    }

    private Map<String, Object> buildProductListMetadata(String keyword, int currentOffset, int nextOffset) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "PRODUCT_LIST");
        metadata.put("keyword", keyword);
        metadata.put("currentOffset", currentOffset);
        metadata.put("nextOffset", nextOffset);
        return metadata;
    }

    private ChatResponse buildScenarioResponse(ChatbotScenario scenario, ChatConversation conversation) {
        String scenarioType = scenario.getScenarioType() == null || scenario.getScenarioType().isBlank()
                ? "TEXT"
                : scenario.getScenarioType().trim().toUpperCase();

        switch (scenarioType) {
            case "SHOP_INFO" -> {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("type", "SHOP_INFO");
                metadata.put("title", scenario.getTitle());

                return buildResponse(
                        conversation,
                        scenario.getAnswer(),
                        false,
                        "SHOP_INFO",
                        null,
                        metadata
                );
            }

            case "PRODUCT_LIST" -> {
                String keyword = extractKeywordFromScenario(scenario);

                if (keyword == null || keyword.isBlank()) {
                    return buildResponse(
                            conversation,
                            scenario.getAnswer(),
                            false,
                            "TEXT",
                            null,
                            null
                    );
                }

                int offset = 0;
                List<Product> products = searchProductsByKeyword(keyword, offset, 10);

                if (products.isEmpty()) {
                    resetProductSearchState(conversation);
                    conversationRepository.save(conversation);

                    return buildResponse(
                            conversation,
                            "Đó là tất cả các mặt hàng của cửa hàng chúng tôi. Không biết bạn còn câu hỏi gì khác không?",
                            false,
                            "TEXT",
                            null,
                            null
                    );
                }

                List<ProductChatItem> items = products.stream()
                        .map(this::mapToChatItem)
                        .toList();

                int nextOffset = offset + 10;
                conversation.setLastProductKeyword(keyword);
                conversation.setLastProductOffset(nextOffset);
                conversationRepository.save(conversation);

                return buildResponse(
                        conversation,
                        scenario.getAnswer(),
                        false,
                        "PRODUCT_LIST",
                        items,
                        buildProductListMetadata(keyword, offset, nextOffset)
                );
            }

            case "NAVIGATE" -> {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("type", "NAVIGATE");
                metadata.put("title", scenario.getTitle());
                metadata.put("targetUrl", scenario.getTargetUrl());
                metadata.put("confirmText", "Xác nhận");
                metadata.put("cancelText", "Hủy");

                return buildResponse(
                        conversation,
                        scenario.getAnswer(),
                        false,
                        "NAVIGATE",
                        null,
                        metadata
                );
            }

            default -> {
                return buildResponse(
                        conversation,
                        scenario.getAnswer(),
                        false,
                        "TEXT",
                        null,
                        null
                );
            }
        }
    }


    private String extractKeywordFromScenario(ChatbotScenario scenario) {
        String title = normalize(scenario.getTitle());
        String keywords = normalize(scenario.getKeywords());

        String combined = title + " " + keywords;

        if (combined.contains("so mi")) return "áo sơ mi";
        if (combined.contains("polo")) return "áo polo";
        if (combined.contains("quan")) return "quần";
        if (combined.contains("blazer") || combined.contains("vest")) return "blazer";
        if (combined.contains("giay") || combined.contains("sneaker")) return "giày";
        if (combined.contains("ca vat") || combined.contains("caravat") || combined.contains("cravat")) return "cà vạt";

        return "";
    }

    private boolean isScopeMatched(String chatType, ChatbotScenario scenario) {
        String scopeType = scenario.getScopeType() == null
                ? "GENERAL"
                : scenario.getScopeType().trim().toUpperCase();

        return switch (scopeType) {
            case "BOTH" -> true;
            case "PRODUCT" -> "PRODUCT".equals(chatType);
            default -> "GENERAL".equals(chatType);
        };
    }

    private boolean matchesScenario(String normalizedMessage, ChatbotScenario scenario) {
        if (normalizedMessage == null || normalizedMessage.isBlank()) {
            return false;
        }

        if (scenario.getQuestionPattern() != null && !scenario.getQuestionPattern().isBlank()) {
            String pattern = normalize(scenario.getQuestionPattern());
            if (!pattern.isBlank() && normalizedMessage.contains(pattern)) {
                return true;
            }
        }

        if (scenario.getKeywords() != null && !scenario.getKeywords().isBlank()) {
            String[] keywords = scenario.getKeywords().split(",");
            for (String keyword : keywords) {
                String normalizedKeyword = normalize(keyword);
                if (!normalizedKeyword.isBlank() && normalizedMessage.contains(normalizedKeyword)) {
                    return true;
                }
            }
        }

        return false;
    }

    private String detectProductKeyword(String normalizedMessage) {
        if (containsAny(normalizedMessage,
                "ao so mi", "so mi", "shirt", "somi")) return "áo sơ mi";

        if (containsAny(normalizedMessage,
                "ao polo", "polo", "ao thun co co")) return "áo polo";

        if (containsAny(normalizedMessage,
                "quan", "quan tay", "quan au", "quan jean", "jean", "quan kaki")) return "quần";

        if (containsAny(normalizedMessage,
                "blazer", "ao blazer", "vest")) return "blazer";

        if (containsAny(normalizedMessage,
                "giay", "giay tay", "giay luoi", "giay sneaker", "sneaker")) return "giày";

        if (containsAny(normalizedMessage,
                "ca vat", "caravat", "cravat", "ca ra vat", "vat")) return "cà vạt";

        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(normalize(keyword))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String input) {
        if (input == null) return "";

        String text = input.toLowerCase(Locale.ROOT).trim();
        text = Normalizer.normalize(text, Normalizer.Form.NFD);
        text = text.replaceAll("\\p{M}", "");
        text = text.replace("đ", "d");
        text = text.replaceAll("[^a-z0-9\\s]", " ");
        text = text.replaceAll("\\s+", " ").trim();

        return text;
    }

    private String safeValue(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private String formatPrice(Double price) {
        if (price == null) {
            return "liên hệ shop";
        }
        return String.format("%,.0f đ", price);
    }

    private ProductChatItem mapToChatItem(Product product) {
        return new ProductChatItem(
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                product.getPrice().doubleValue(),
                product.getDescription(),
                "/product-detail.html?id=" + product.getId()
        );
    }

    private Map<String, Object> buildProductMetadata(Product product) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("productId", product.getId());
        metadata.put("productName", product.getName());
        metadata.put("price", product.getPrice());
        metadata.put("image", product.getImageUrl());
        return metadata;
    }

    private Set<Long> getShownProductIds(ChatConversation conversation) {
        List<ChatMessage> messages = messageRepository.findByConversationId(conversation.getId());

        Set<Long> shownIds = new HashSet<>();
        for (ChatMessage msg : messages) {
            String text = msg.getMessage();
            if (text == null || text.isBlank()) continue;
        }

        return shownIds;
    }

    private SizeRecommendation extractAndRecommendSize(String normalizedMessage, Product product) {
        Integer heightCm = extractHeightCm(normalizedMessage);
        Integer weightKg = extractWeightKg(normalizedMessage);

        if (heightCm == null || weightKg == null) {
            return null;
        }

        String recommendedSize = suggestSize(heightCm, weightKg);
        if (recommendedSize == null || recommendedSize.isBlank()) {
            return new SizeRecommendation(heightCm, weightKg, null, false);
        }

        boolean available = isSizeAvailable(product.getSize(), recommendedSize);

        return new SizeRecommendation(heightCm, weightKg, recommendedSize, available);
    }

    private Integer extractHeightCm(String message) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(1\\d{2}|2\\d{2})\\s*(cm)?");
        java.util.regex.Matcher matcher = pattern.matcher(message);

        while (matcher.find()) {
            int value = Integer.parseInt(matcher.group(1));
            if (value >= 140 && value <= 220) {
                return value;
            }
        }

        return null;
    }

    private Integer extractWeightKg(String message) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(3\\d|4\\d|5\\d|6\\d|7\\d|8\\d|9\\d|1\\d{2})\\s*(kg)?");
        java.util.regex.Matcher matcher = pattern.matcher(message);

        while (matcher.find()) {
            int value = Integer.parseInt(matcher.group(1));
            if (value >= 35 && value <= 150) {
                return value;
            }
        }

        return null;
    }

    private String suggestSize(int heightCm, int weightKg) {
        if (heightCm < 160 || weightKg < 50) {
            return "S";
        }

        if ((heightCm >= 160 && heightCm <= 168) || (weightKg >= 50 && weightKg <= 58)) {
            return "M";
        }

        if ((heightCm >= 169 && heightCm <= 175) || (weightKg >= 59 && weightKg <= 67)) {
            return "L";
        }

        if ((heightCm >= 176 && heightCm <= 182) || (weightKg >= 68 && weightKg <= 78)) {
            return "XL";
        }

        if (heightCm > 182 || weightKg > 78) {
            return "XXL";
        }

        return null;
    }

    private boolean isSizeAvailable(String productSizes, String expectedSize) {
        if (productSizes == null || productSizes.isBlank() || expectedSize == null || expectedSize.isBlank()) {
            return false;
        }

        String normalizedSizes = normalize(productSizes).replace(" ", "");
        String normalizedExpected = normalize(expectedSize).replace(" ", "");

        String[] sizes = normalizedSizes.split(",");
        for (String size : sizes) {
            if (size.trim().equalsIgnoreCase(normalizedExpected)) {
                return true;
            }
        }

        return false;
    }

    private static class SizeRecommendation {
        private final Integer heightCm;
        private final Integer weightKg;
        private final String recommendedSize;
        private final boolean available;

        public SizeRecommendation(Integer heightCm, Integer weightKg, String recommendedSize, boolean available) {
            this.heightCm = heightCm;
            this.weightKg = weightKg;
            this.recommendedSize = recommendedSize;
            this.available = available;
        }

        public Integer getHeightCm() {
            return heightCm;
        }

        public Integer getWeightKg() {
            return weightKg;
        }

        public String getRecommendedSize() {
            return recommendedSize;
        }

        public boolean isAvailable() {
            return available;
        }
    }

    private boolean isProductInfoQuestion(String normalizedMessage) {
        return containsAny(normalizedMessage,
                "tu van", "tu van gi", "tu van san pham", "hoi", "ho tro", "giup toi",
                "gia", "bao nhieu tien", "gia bao nhieu", "price", "cost",
                "size", "con size", "size gi", "size nao", "co nhung size nao",
                "co bao nhieu size", "bao nhieu size", "kich co", "co nhung kich co nao",
                "mau gi", "mau sac", "co mau nao", "co nhung mau nao", "color",
                "mo ta", "chi tiet", "thong tin san pham", "san pham nay", "ao nay", "quan nay",
                "con hang", "het hang", "con khong", "stock",
                "chat lieu", "vai gi", "vai", "material"
        );
    }

    private String resolveSessionCode(ChatRequest request) {
        String sessionCode = request.getSessionCode();

        if (sessionCode == null || sessionCode.isBlank() || sessionCode.startsWith("chat_")) {
            return UUID.randomUUID().toString();
        }

        return sessionCode.trim();
    }

    private ChatResponse buildResponse(
            ChatConversation conversation,
            String message,
            boolean fallback,
            String responseType,
            List<?> products,
            Map<String, Object> metadata
    ) {
        return new ChatResponse(
                "BOT",
                message,
                fallback,
                responseType,
                products,
                metadata,
                conversation.getSessionCode()
        );
    }
}
