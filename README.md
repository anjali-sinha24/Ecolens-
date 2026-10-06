EcoLens AI

**EcoLens AI** is a personal carbon footprint calculator and sustainability coach that helps users understand their environmental impact and take simple actions to reduce it.

The project collects lifestyle information such as electricity usage, transportation, water, food, waste, and flights, calculates an estimated carbon footprint, saves the result using an AWS backend, and provides personalized sustainability recommendations based on the user's biggest contributor.

Problem Statement

Many people want to reduce their carbon footprint but do not know how much carbon their daily lifestyle produces, which activity contributes the most, or what practical changes they can make.

EcoLens AI provides a simple and easy-to-understand solution.

Our Solution

EcoLens AI:
1. Collects everyday lifestyle information.
2. Calculates an estimated carbon footprint.
3. Breaks the footprint into major contributors.
4. Identifies the biggest contributor.
5. Gives personalized sustainability actions.
6. Sends calculation data to the AWS backend.
7. Stores the result in Amazon DynamoDB.

 Key Features

Carbon Footprint Calculator — calculate an estimated footprint from lifestyle data.
Contributor Breakdown— view major contributors such as transportation, electricity, household activities, water, food, waste, and flights.
Smart Sustainability Coach — identifies the biggest contributor and provides personalized practical recommendations.
AWS Cloud Backend— processes and stores calculator data using AWS.
Cloud Database— stores results in Amazon DynamoDB.
Sustainability Guidan— suggests simple actions to reduce environmental impact.

>  The current Smart Sustainability Coach uses a local/rule-based recommendation engine. Amazon Bedrock is not required for the current working implementation.

Technologies Used

Frontend
- HTML5
- CSS3
- JavaScript

Backend
- Python
- AWS Lambda
- Amazon API Gateway

 Database
- Amazon DynamoDB

 Deployment
- GitHub
- Render

# AWS Architecture

```text
┌──────────────────────────┐
│          User            │
│        EcoLens AI        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         Render           │
│    Frontend Website      │
└────────────┬─────────────┘
             │ API Request
             ▼
┌──────────────────────────┐
│    Amazon API Gateway    │
│        HTTP API          │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       AWS Lambda         │
│     Python Backend       │
└────────────┬─────────────┘
             │ Save Data
             ▼
┌──────────────────────────┐
│     Amazon DynamoDB      │
│       EcoLensData        │
└──────────────────────────┘
```

# Project Flowchart

```text
                 ┌──────────────────────┐
                 │      User Opens      │
                 │       EcoLens        │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Enter Lifestyle Data │
                 │ • Electricity        │
                 │ • Transportation     │
                 │ • Water              │
                 │ • Food               │
                 │ • Waste              │
                 │ • Flights            │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Calculate Carbon     │
                 │      Footprint       │
                 └──────────┬───────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │ Identify Biggest    │    │ Send Result to      │
   │ Contributor          │    │ AWS Backend         │
   └──────────┬──────────┘    └──────────┬──────────┘
              │                           │
              ▼                           ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │ Smart Sustainability│    │    API Gateway      │
   │       Coach         │    └──────────┬──────────┘
   └──────────┬──────────┘               │
              │                          ▼
              │                ┌─────────────────────┐
              │                │    AWS Lambda       │
              │                └──────────┬──────────┘
              │                           │
              │                           ▼
              │                ┌─────────────────────┐
              │                │     DynamoDB        │
              │                │    EcoLensData      │
              │                └─────────────────────┘
              │
              ▼
   ┌─────────────────────┐
   │ Personalized        │
   │ Sustainability      │
   │ Recommendations     │
   └─────────────────────┘
```

How EcoLens Works

Step 1 — Enter Information
The user enters lifestyle information through the calculator.

Step 2 — Calculate Footprint
EcoLens processes the entered values and calculates an estimated carbon footprint.

Step 3 — Analyze Contributors
The system compares the different contributors and identifies the area with the largest impact.

Step 4 — Get Recommendations
The Smart Sustainability Coach provides actions related to the user's biggest contributor.

Step 5 — Save Data
The calculator sends the result through:

**API Gateway → AWS Lambda → DynamoDB**

Step 6 — View Results
The user sees the estimated footprint and personalized recommendations on the website.

Smart Sustainability Coach

EcoLens uses a personalized recommendation engine rather than showing exactly the same advice to every user.

```text
User's largest contributor
          ↓
   Identify category
          ↓
Personalized recommendations
```

For example, if electricity is the largest contributor, the coach gives electricity-focused recommendations. If transportation is the largest contributor, it gives transportation-focused recommendations.

Backend Data

The AWS backend stores calculation results in:

```text
EcoLensData
```

Stored information can include:
- Record ID
- Carbon footprint
- Electricity contribution
- Transportation contribution
- Waste contribution
- User inputs
- Creation timestamp

The backend is implemented using **AWS Lambda with Python**.

Project Structure

```text
Ecolens-
│
├── index.html
├── about.html
├── calculator.html
├── calculator.js
├── style.css
│
├── hero.png
├── about1.jpg
├── about2.png
├── about3.jpg
│
└── backend/
    └── lambda_function.py
```

Deployment

Frontend
The frontend source code is maintained in GitHub and deployed using Render.

Backend
The backend runs on AWS:

```text
AWS API Gateway
       ↓
AWS Lambda
       ↓
Amazon DynamoDB
```

The frontend communicates with the backend through the API Gateway endpoint.

 Setup
 1. Clone the Repository

```bash
git clone https://github.com/anjali-sinha24/Ecolens-.git
```

2. Open the Project

Open the downloaded project folder in VS Code.
 3. Run the Frontend

Use a local development server such as VS Code Live Server.

 4. Configure the AWS Backend

The AWS backend requires:
- AWS Lambda function
- API Gateway HTTP API
- DynamoDB table

The frontend JavaScript should point to the deployed API Gateway endpoint.

 Benefits

EcoLens AI helps users:
- Understand their carbon footprint
- Identify their biggest environmental contributor
- Receive personalized sustainability suggestions
- Store calculation data using a cloud backend
- Learn practical ways to reduce environmental impact

 Future Scope

Possible future improvements:
- Historical footprint tracking
- Monthly sustainability reports
- User accounts and dashboards
- More detailed emission factors
- Advanced AI-generated sustainability advice
- Goal setting and progress tracking
- Community sustainability challenges

 Project Summary

**EcoLens AI** combines a simple carbon footprint calculator with personalized sustainability guidance and cloud-based data storage.

The project demonstrates how **HTML, CSS, JavaScript, AWS API Gateway, AWS Lambda, and Amazon DynamoDB** can be combined to create a practical sustainability solution.

> **Measure your impact. Understand your biggest contributor. Take smarter steps toward a greener lifestyle. 🌱**

**EcoLens AI — Personal Carbon Footprint & Sustainability Coach**

Built for an AWS student/hackathon project.
