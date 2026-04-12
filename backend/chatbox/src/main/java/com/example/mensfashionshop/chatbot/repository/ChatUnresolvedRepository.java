package com.example.mensfashionshop.chatbot.repository;

import com.example.mensfashionshop.chatbot.entity.ChatUnresolved;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatUnresolvedRepository extends JpaRepository<ChatUnresolved, Long> {
    List<ChatUnresolved> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatusIgnoreCase(String status);

    @Query("""
        select count(distinct u.conversation.id)
        from ChatUnresolved u
    """)
    long countDistinctConversationIds();

    @Query("""
        select count(distinct u.conversation.id)
        from ChatUnresolved u
        where upper(u.status) = upper(:status)
    """)
    long countDistinctConversationIdsByStatus(@Param("status") String status);

    @Query("""
        select count(distinct u.conversation.id)
        from ChatUnresolved u
        where u.createdAt >= :start and u.createdAt < :end
    """)
    long countDistinctConversationIdsToday(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
        select u
        from ChatUnresolved u
        where u.id in (
            select max(x.id)
            from ChatUnresolved x
            group by x.conversation.id
        )
        order by u.createdAt desc
    """)
    List<ChatUnresolved> findLatestPerConversation();

    @Query("""
        select u
        from ChatUnresolved u
        where upper(u.status) = upper(:status)
          and u.id in (
            select max(x.id)
            from ChatUnresolved x
            where upper(x.status) = upper(:status)
            group by x.conversation.id
          )
        order by u.createdAt desc
    """)
    List<ChatUnresolved> findLatestPerConversationByStatus(@Param("status") String status);

    @Query("""
        select u
        from ChatUnresolved u
        where u.conversation.id = :conversationId
    """)
    List<ChatUnresolved> findByConversationId(@Param("conversationId") Long conversationId);
}