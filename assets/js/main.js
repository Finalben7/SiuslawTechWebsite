document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("loaded");
});

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const formData = new FormData(contactForm);

        const response = await fetch(contactForm.action, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {

            contactForm.innerHTML = `
                <div class="form-success">
                    <h2>Thank You!</h2>
                    <p>
                        Thank you for reaching out. Someone will get in touch shortly
                        to help with your request.
                    </p>
                </div>
            `;

        } else {
            alert(result.message);
        }
    });
}