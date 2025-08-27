import os
from dotenv import load_dotenv
import time
load_dotenv()
os.environ["GEMINI_API_KEY"] = "AIzaSyDNaarHmdVPnRUyyJeDDzAkvGhLD4RomOQ"
from dotenv import load_dotenv
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from langgraph.graph import StateGraph , START , END , MessageGraph 
from langchain_core.messages import HumanMessage , AIMessage , SystemMessage
from typing import TypedDict
from langchain_google_genai import ChatGoogleGenerativeAI
model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
# assignmet
from langchain_core.prompts import ChatPromptTemplate

chat_template = ChatPromptTemplate([
    ('system', 
     """You are a smart and friendly AI assistant. 
Always respond clearly and politely.
dont use * or * ** anywhere , answer my question without using any special characters like * or -
If the user asks a question, give a helpful and simple answer.
If the user gives feedback or a complaint, acknowledge it politely.
Do not mention that you are an AI or describe your role.
Do not explain your process — only respond naturally to the user's message.
Your goal is to help the user as clearly and kindly as possible and answer the chat as same as gemini , dont use ** , the answer should be lengthy
if the question has multiple parts , answer each part clearly and seperately
first print the heading after that leave a line break and then answer , tell me the answer in the moost beautiful way and clearly explained
dont use any special characters , use only letters and nmbers , whenever you are explaining any topic or listing any points or examples, the heading should be printed in the seperate line break and then explain the topic 
for listing points use numbers , not ** or -"""
    ),
    ('human', '{chat}')])
text = input("enter your query: ") 
prompt = chat_template.invoke({'chat':text})
# fill the values of the placeholders
#prompt = template.invoke({'name':'mudassir'})

result = model.invoke(prompt)
print(result.content)

time.sleep(15) 