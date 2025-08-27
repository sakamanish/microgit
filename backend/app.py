from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        # New OpenAI v1.x syntax
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        answer = response.choices[0].message.content.strip()
        return jsonify({"response": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/send-email", methods=["POST"])
def send_email():
    data = request.get_json()
    to_email = data.get("to")
    question = data.get("prompt")
    answer = data.get("response")

    if not (to_email and question and answer):
        return jsonify({"error": "Missing fields"}), 400

    subject = "Your AI Study Buddy Response"
    body = f"Your Question:\n{question}\n\nGPT-4 Response:\n{answer}"

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = os.getenv("SMTP_SENDER")
    msg['To'] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(os.getenv("SMTP_SENDER"), os.getenv("SMTP_PASSWORD"))
            server.send_message(msg)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
