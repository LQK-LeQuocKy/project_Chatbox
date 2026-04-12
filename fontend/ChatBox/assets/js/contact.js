document.addEventListener("DOMContentLoaded", function () {
  initContactForm();
});

function initContactForm() {
  const form = document.getElementById("contactForm");
  const message = document.getElementById("contactMessage");

  if (!form || !message) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const topic = document.getElementById("topic").value;
    const content = document.getElementById("message").value.trim();

    if (!fullName || !phone || !email || !topic || !content) {
      showMessage("Vui lòng nhập đầy đủ thông tin liên hệ.", "error");
      return;
    }

    const newContact = {
      id: Date.now(),
      fullName,
      phone,
      email,
      topic,
      message: content,
      status: "new",
      createdAt: new Date().toISOString()
    };

    const contacts = JSON.parse(localStorage.getItem("contactMessages")) || [];
    contacts.unshift(newContact);
    localStorage.setItem("contactMessages", JSON.stringify(contacts));

    form.reset();
    showMessage("Gửi thông tin liên hệ thành công. Men Fashion sẽ phản hồi sớm nhất.", "success");
  });

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `contact-message ${type}`;
  }
}