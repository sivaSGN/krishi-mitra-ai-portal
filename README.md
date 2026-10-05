# Krishi Mitra AI

Build a modern, advanced, professional frontend-only web application called “KrishiMitra AI – AI Farmer Scheme Assistant”.

IMPORTANT:

FRONTEND ONLY.

Do NOT create a backend, database, authentication server, API server, or payment system.

Use realistic MOCK/DUMMY data for all AI responses, schemes, eligibility results, notifications, and statistics.

The application must run completely in the browser.

Make the UI look like a real production-level AI SaaS dashboard.

Make it responsive for desktop, tablet, and mobile.

Use React + TypeScript + Tailwind CSS.

Use reusable components and clean project structure.

Add smooth animations and professional transitions.

Do not leave empty pages or placeholder sections.

PROJECT PURPOSE

KrishiMitra AI is an AI-powered assistant designed to help farmers:

Ask questions using an AI assistant.

Discover government agricultural schemes.

Check scheme eligibility.

Understand required documents.

View personalized scheme recommendations.

Track saved schemes.

Get notifications about relevant schemes.

Use multiple Indian languages.

Access agricultural information through a simple interface.

The target users are:

Farmers

Rural users

Elderly users

Low-literacy users

Students/demo users

The interface should be simple enough for a farmer but visually advanced enough for a college AI/ML project demonstration.

MAIN DESIGN

Create a professional agricultural + AI visual identity.

Application name:
“KrishiMitra AI”

Tagline:
“Your AI-Powered Assistant for Government Schemes”

Use:

Green agricultural theme

White/light backgrounds

Dark green primary text

Modern cards

Rounded corners

Soft shadows

Clean icons

Professional dashboard layout

AI assistant visual elements

Agriculture-related illustrations/icons

Do NOT make it look like a basic student CRUD application.

MAIN LAYOUT

Create a responsive dashboard layout with:

LEFT SIDEBAR:

KrishiMitra AI logo

Dashboard

AI Assistant

Find Schemes

Eligibility Checker

Recommended for You

Saved Schemes

Notifications

My Profile

Help & Support

BOTTOM SIDEBAR:

Language selector

Dark/Light mode

User profile

TOP HEADER:

Search schemes

Notification icon

Language selector

Farmer profile

Mobile menu

PAGE 1 – DASHBOARD

Create an advanced farmer dashboard.

Header:

“Good Morning, Farmer 👋”

Subtitle:

“Let KrishiMitra AI help you discover the right government schemes.”

Add large AI assistant card:

“Ask KrishiMitra AI”

Example:
“Which government schemes am I eligible for?”

Buttons:

Ask AI

Check Eligibility

Find Schemes

Create statistics cards:

Available Schemes: 120+

Recommended Schemes: 8

Eligible Schemes: 5

Saved Schemes: 6

Create section:

“Recommended For You”

Show scheme cards with:

Scheme name

Government department

Benefit amount

Eligibility status

Deadline

View Details button

Check Eligibility button

Save button

Example schemes:

PM-KISAN

Pradhan Mantri Fasal Bima Yojana

Kisan Credit Card

PM-KUSUM

Soil Health Card Scheme

Agriculture Infrastructure Fund

Use mock data only.

Create:

“Recent Activity”

Examples:

Eligibility checked for PM-KISAN

Saved PM-KUSUM

Asked AI about crop insurance

Viewed Kisan Credit Card

PAGE 2 – AI ASSISTANT

Create a professional ChatGPT-style AI assistant interface specifically for farmers.

Header:

“KrishiMitra AI Assistant”

Subtitle:
“Ask questions about government schemes, eligibility, farming benefits and documents.”

Chat area with example conversation.

USER:
“Which government schemes are available for small farmers?”

AI:
“Based on the information you provided, you may be eligible for several agricultural schemes. I found 4 potentially relevant schemes.”

Display scheme recommendation cards inside the chat.

Add suggested questions:

Which schemes am I eligible for?

How can I apply for PM-KISAN?

What documents are required?

Is crop insurance available?

What subsidies are available for solar pumps?

Tell me about farmer loans.

Message input:

“Ask KrishiMitra AI anything…”

Buttons:

Send

Microphone

Upload Document

IMPORTANT:
The AI response should be MOCKED frontend data. Do not connect to a real AI API.

PAGE 3 – SCHEME DISCOVERY

Create a professional “Find Government Schemes” page.

Search bar:

“Search schemes…”

Filters:

Category

State

Farmer Type

Benefit Type

Eligibility

Deadline

Categories:

Financial Assistance

Crop Insurance

Loans

Irrigation

Equipment Subsidy

Solar Energy

Seeds & Fertilizers

Women Farmers

Small Farmers

Create scheme cards containing:

Scheme Name
Department
Short description
Benefit
Eligibility
Application status
Deadline
View Details
Check Eligibility
Save Scheme

Add pagination or load-more UI.

PAGE 4 – ELIGIBILITY CHECKER

Create an advanced multi-step eligibility wizard.

Title:

“Check Your Scheme Eligibility”

Progress indicator:

Step 1 → Personal Information
Step 2 → Farming Information
Step 3 → Land Information
Step 4 → Income & Documents
Step 5 → Eligibility Result

STEP 1:

Name

Age

Gender

State

District

STEP 2:

Farmer Type

Crop Type

Farming Experience

Irrigation Type

STEP 3:

Land Ownership

Land Size

Land Location

STEP 4:

Annual Income

Aadhaar availability

Bank account

Land document

Required certificates

Add Back / Continue buttons.

After completion, show a professional eligibility result dashboard.

Example:

“Eligibility Analysis Complete”

Show:

Eligible:
PM-KISAN ✓

Potentially Eligible:
Kisan Credit Card

Not Eligible:
Example scheme

For every result show:

Eligibility status

Reason

Benefits

Required documents

Next steps

View Scheme button

Use a visual eligibility progress/result component.

IMPORTANT:
Eligibility calculations should be MOCK frontend logic only.

PAGE 5 – RECOMMENDED SCHEMES

Create an AI-powered recommendation dashboard.

Title:

“Recommended For You”

Subtitle:

“Schemes matched to your farmer profile.”

Show:

“AI Match Score”

Example:

PM-KISAN — 95%
PM-KUSUM — 88%
Crop Insurance — 82%

IMPORTANT:
These scores are demo/mock values only.

Add explanation:

“Why this scheme is recommended”

Example:
✓ Matches your farmer type
✓ Available in your state
✓ Matches your land category
✓ Suitable for your crop

PAGE 6 – SCHEME DETAILS

Create a detailed scheme page.

Include:

Scheme name

Government department

Scheme category

Benefit amount

Eligibility

Required documents

Application process

Important dates

Frequently asked questions

Add:

“Check My Eligibility”

“Save Scheme”

“Ask AI About This Scheme”

“Application Guide”

Create a timeline:

Check eligibility

Prepare documents

Submit application

Verification

Benefit received

PAGE 7 – SAVED SCHEMES

Create:

“Saved Schemes”

Show saved scheme cards.

Each card:

Scheme name

Benefit

Deadline

Eligibility

Remove button

View details

Add empty-state UI if there are no saved schemes.

PAGE 8 – NOTIFICATIONS

Create notification center.

Examples:

“New scheme available in your state”

“PM-KISAN information updated”

“Your saved scheme deadline is approaching”

“Eligibility profile needs updating”

Use read/unread states.

PAGE 9 – FARMER PROFILE

Create profile dashboard.

Sections:

Personal Information
Farming Information
Land Information
Documents
Preferences

Fields:

Name
Age
State
District
Farmer Type
Crop
Land Size
Income

Add:

“Update Profile”

“Run Eligibility Check”

PAGE 10 – LANGUAGE SUPPORT

Create a language selector.

Languages:

English
తెలుగు
தமிழ்
हिन्दी

The UI should demonstrate language switching using frontend mock translations.

PAGE 11 – HELP & SUPPORT

Create:

FAQ section
AI help
Contact support
How to use KrishiMitra AI
How to check eligibility
How to find schemes

Add simple farmer-friendly explanations.

ADVANCED UI FEATURES

Add:

Responsive sidebar

Mobile navigation

Search

Filters

Tabs

Modal dialogs

Toast notifications

Progress bars

Status badges

Skeleton loading

Empty states

Hover effects

Smooth page transitions

Tooltips

Dropdown menus

Confirmation dialogs

Dark mode

Responsive charts

DASHBOARD CHARTS

Add mock analytics charts:

Scheme categories distribution

Eligibility results

Monthly scheme searches

Saved schemes

Use frontend mock data.

AI FEATURES UI

Create visually advanced AI components:

AI thinking animation

Typing indicator

AI response cards

Suggested questions

AI recommendation explanation

Voice input button UI

Document upload UI

AI confidence indicator

Do not connect these to a real AI model.

MOCK DATA

Create realistic mock scheme data for at least 10 schemes.

Each scheme should have:

id
name
department
category
description
benefit
eligibility
documents
state
deadline
status
matchScore

Use realistic Indian government agriculture scheme examples.

COMPONENT STRUCTURE

Create reusable components:

Sidebar
Header
DashboardCard
SchemeCard
SchemeDetails
EligibilityWizard
EligibilityResult
AIChat
AIMessage
RecommendationCard
NotificationCard
ProfileCard
SearchBar
FilterPanel
LanguageSelector
ThemeToggle
Modal
Toast
LoadingSkeleton

NAVIGATION

Use React Router.

Routes:

/dashboard
/assistant
/schemes
/eligibility
/recommended
/schemes/:id
/saved
/notifications
/profile
/help

The application should navigate between all pages correctly.

DEMO EXPERIENCE

When the user opens the application:

Show Dashboard.

Clicking “Ask AI” opens the AI Assistant.

Clicking “Check Eligibility” opens the eligibility wizard.

After completing the wizard, display a realistic eligibility result.

Clicking a scheme opens its detailed page.

Clicking Save adds it to Saved Schemes.

Search and filters should work using local mock data.

Language selector should switch visible UI labels using local frontend translations.

IMPORTANT TECHNICAL REQUIREMENTS

Frontend only

No backend

No database

No API keys

No external authentication

No real AI API

No real government API

No payment integration

Use mock data

Use local state/localStorage where useful

Clean TypeScript

Reusable components

Responsive design

Production-quality UI

No broken links

No unfinished sections

No “coming soon” pages

FINAL RESULT

The final application should look like a real advanced AI-powered agricultural government scheme platform, suitable for:

College major project

AI/ML project demonstration

Cloud computing project frontend

Final-year project presentation

Portfolio

Project PPT screenshots

Viva demonstration

Project branding:

KRISHIMITRA AI

“AI-Powered Government Scheme Assistant for Farmers”

Make the interface polished, modern, accessible, farmer-friendly, and visually impressive.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://krishi-mitra-ai-portal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/78af1145-c4fe-47e2-a0fa-ccc429144202).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
