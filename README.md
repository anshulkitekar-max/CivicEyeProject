# City Watch

CivicEye — Smart City Civic Problem Reporting Platform



Build a complete, production-style full-stack web application called CivicEye for a college hackathon.



The purpose of CivicEye is to allow citizens to report civic problems such as potholes, garbage, broken streetlights, drainage issues, damaged roads, water leakage, traffic problems, and other public infrastructure problems. The submitted report should reach an admin dashboard with the user's location displayed on an interactive map so administrators can manage and resolve problems.



1. Technology and Architecture



Create the complete application including:



- Responsive frontend

- Backend/API

- Database

- User authentication

- Admin authentication

- Image/file storage

- Location/geolocation handling

- Interactive map

- Report management

- User reward/points system

- Proper validation and error handling



Use Supabase for:



- Authentication

- PostgreSQL database

- File/image storage

- Backend/database operations



Use a suitable map solution such as Leaflet with OpenStreetMap if possible, so the project does not require an expensive map service.



Use a clean modern architecture and keep the code organized and maintainable.



The application must work on both desktop and mobile.



---



2. CITIZEN / USER INTERFACE



A. Landing Page



Create a professional landing page containing:



- CivicEye logo/name

- Short description:

  "Report civic problems. Track progress. Build a better city."

- "Report a Problem" button

- "Login" button

- "Register" button

- Explanation of how CivicEye works

- Features section

- Reward/points section



Design should look like a modern smart-city application.



---



3. USER AUTHENTICATION



Create:



Registration



Fields:



- Full name

- Email

- Password

- Confirm password



Store user information securely.



Login



Fields:



- Email

- Password



After successful login, redirect to the User Dashboard.



Protect authenticated pages so users cannot access them without logging in.



---



4. USER DASHBOARD



Create a user dashboard with:



- User name

- Profile section

- Total reports submitted

- Pending reports

- Resolved reports

- Reward points

- "Report a Problem" button

- "My Reports" section

- Logout button



Navigation:



- Dashboard

- Report Problem

- My Reports

- Rewards

- Profile

- Logout



---



5. REPORT A CIVIC PROBLEM



This is the most important feature.



Create a report form containing:



Problem Category



Dropdown with:



- Pothole / Damaged Road

- Garbage / Waste

- Broken Streetlight

- Water Leakage

- Drainage / Sewerage

- Traffic / Road Sign

- Damaged Public Property

- Illegal Dumping

- Tree / Greenery Problem

- Other



Problem Description



Provide a large text area.



Example placeholder:



"Describe the problem and provide any useful details..."



Problem Photo



Allow the user to:



- Take a photo using the mobile camera

- Or upload a photo from the device



The photo should be stored in Supabase Storage.



Show a preview before submission.



Do not allow submission if the required photo is missing.



Live Location



Add a "Get My Location" button.



Use the browser Geolocation API to obtain:



- Latitude

- Longitude



Ask the user for location permission.



Display the captured location on a small map.



Also show:



"Location captured successfully"



If location permission is denied, clearly explain how the user can enable it.



Do not use a fake location.



Submit Report



Add a prominent:



"Submit Report"



button.



When submitted:



1. Validate all required fields.

2. Upload the image to Supabase Storage.

3. Get the user's latitude and longitude.

4. Save the report in the database.

5. Associate the report with the logged-in user.

6. Set initial status to "Pending".

7. Give the user initial reward points.

8. Show a success message.

9. Generate a unique report ID.

10. Redirect to the report details page.



---



6. REPORT DATABASE



Create a proper database table called "reports".



Suggested fields:



- id

- user_id

- category

- description

- photo_url

- latitude

- longitude

- status

- admin_note

- created_at

- updated_at

- resolved_at



Status values:



- Pending

- In Progress

- Resolved

- Rejected



Create relationships between reports and users.



Make sure Row Level Security is configured correctly.



Users should only be able to see their own reports.



Admins should be able to see and manage all reports.



---



7. MY REPORTS



Create a page where users can see all reports they submitted.



Each report card should show:



- Report ID

- Photo

- Category

- Description

- Date

- Location

- Status



Use visual status indicators:



Pending → yellow



In Progress → blue



Resolved → green



Rejected → red



Clicking a report should open a detailed report page.



---



8. ADMIN AUTHENTICATION



Create a separate secure admin login.



Admin should NOT use the normal user dashboard.



Create an admin role in the database.



Only users with the admin role can access the admin dashboard.



Protect admin routes properly.



---



9. ADMIN DASHBOARD



Create a professional admin dashboard.



The main screen should contain an interactive map.



The map should show all submitted civic reports as markers using their actual latitude and longitude.



When a user submits a report, it should automatically appear on the admin dashboard after the dashboard refreshes or receives updated data.



Each marker should contain:



- Problem category

- Photo

- Description

- Status

- Date

- Report ID



When the admin clicks a marker, show a report information panel/modal.



---



10. ADMIN MAP



Use:



Leaflet + OpenStreetMap



The map should:



- Show all reports

- Use latitude/longitude stored in the database

- Allow zooming

- Allow panning

- Open report details when a marker is clicked

- Automatically fit the map to available reports when appropriate



Do NOT use hardcoded fake report locations.



---



11. ADMIN REPORT MANAGEMENT



Create an admin report-management section.



Admin should be able to:



- View all reports

- Search reports

- Filter by category

- Filter by status

- View report photo

- View description

- View user information

- View exact location

- Change status

- Add admin notes

- Mark report as resolved

- Reject invalid reports



When admin changes a report status, update the database.



The user should be able to see the updated status in their "My Reports" section.



---



12. ADMIN DASHBOARD STATISTICS



At the top of the admin dashboard show:



- Total Reports

- Pending Reports

- In Progress

- Resolved Reports

- Reports Today



Add simple charts if appropriate.



Example:



Reports by category.



Reports by status.



---



13. USER REWARD SYSTEM



CivicEye should encourage citizens to participate.



Create a simple points system.



Example:



- Valid report submitted: +10 points

- Report verified by admin: +20 points

- Report resolved: +10 bonus points



Show:



- Total points

- Number of reports

- User ranking/leaderboard



Do not allow users to manually change their points.



Only backend/database logic should modify reward points.



---



14. NOTIFICATIONS



Create simple notifications for important events.



For example:



When a report is submitted:



"Your report has been submitted successfully."



When admin changes status:



"Your report #XXXX is now In Progress."



When resolved:



"Your civic problem has been marked as Resolved."



If real-time notifications are practical with Supabase, implement them.



Otherwise implement a notification table and display notifications when the user opens the dashboard.



---



15. SECURITY



Implement:



- Secure authentication

- Password handling through Supabase Auth

- Protected user routes

- Protected admin routes

- Role-based access

- Supabase Row Level Security

- Users can only edit/view their own appropriate data

- Admin can manage all reports

- Validate uploaded files

- Limit image file size

- Accept common image formats only

- Prevent unauthorized database access



Never expose secret keys in frontend code.



Use environment variables for sensitive configuration.



---



16. MOBILE EXPERIENCE



The user reporting process will mainly be used on smartphones.



Make the report page mobile-first.



The user should easily be able to:



1. Login

2. Open dashboard

3. Click Report Problem

4. Take a photo

5. Capture location

6. Select category

7. Enter description

8. Submit



Make buttons large and easy to tap.



---



17. UI DESIGN



Use a modern smart-city visual style.



Design requirements:



- Clean dashboard

- Professional cards

- Rounded corners

- Clear typography

- Responsive layout

- Mobile-friendly navigation

- Good spacing

- Accessible buttons

- Loading indicators

- Success/error messages

- Empty states

- Confirmation dialogs



Do not make the interface unnecessarily complicated.



The application should look impressive enough for a college hackathon demonstration.



---



18. IMPORTANT DATA FLOW



The final application must implement this complete flow:



Citizen:



Login

↓

User Dashboard

↓

Report Problem

↓

Select Category

↓

Take/Upload Live Photo

↓

Capture GPS Location

↓

Enter Description

↓

Submit

↓

Supabase Storage + Database

↓

Report Created

↓

Admin Dashboard

↓

Report Appears on Map

↓

Admin Opens Report

↓

Admin Changes Status

↓

Database Updated

↓

User Sees Updated Status



---



19. DEMO REQUIREMENT



Make sure the application is actually functional, not just a UI prototype.



Do not create fake buttons that do nothing.



All major buttons should perform real actions.



The database should contain real records created through the application.



The photo upload should actually work.



The location should come from the browser's Geolocation API.



The admin map should use real coordinates stored with reports.



The status update should actually update the database.



---



20. DEVELOPMENT APPROACH



First build the complete core functionality:



1. Authentication

2. Database

3. User dashboard

4. Report submission

5. Photo upload

6. GPS location

7. Admin dashboard

8. Admin map

9. Report management

10. Status updates



Then add:



11. Rewards

12. Notifications

13. Charts

14. UI polish



If any requirement cannot be implemented exactly as requested, explain the limitation and implement the closest working alternative rather than creating a fake feature.



After building, provide a clear explanation of:



- Database tables

- Authentication

- User flow

- Admin flow

- API/backend flow

- Storage

- Map integration

- Security/RLS

- How to run the project

- Required environment variables

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://city-voice-hub-79.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1583f772-63c2-415b-9eba-12513b5d8929).

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
