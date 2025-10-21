# Demo Data for BPUT CareerAI Platform

## Overview
This document contains information about the demo data populated in the BPUT CareerAI platform for hackathon demonstration purposes.

## Demo Employer Accounts

### Login Credentials
All demo employer accounts use the password: `Demo@123`

| Company | Email | Industry | Location |
|---------|-------|----------|----------|
| Tata Consultancy Services | tcs@demo.com | IT Services | Mumbai, Maharashtra |
| Infosys Limited | infosys@demo.com | IT Services | Bangalore, Karnataka |
| Reliance Industries | reliance@demo.com | Conglomerate | Mumbai, Maharashtra |
| Flipkart | flipkart@demo.com | E-commerce | Bangalore, Karnataka |
| Zoho Corporation | zoho@demo.com | Software Product | Chennai, Tamil Nadu |

### Company Details

#### 1. Tata Consultancy Services (TCS)
- **Size**: 1000+ employees
- **Status**: Verified
- **Website**: https://www.tcs.com
- **Description**: TCS is a global leader in IT services, consulting, and business solutions
- **Open Positions**: 3 jobs (18 positions)
  - Software Engineer - Full Stack (5 positions)
  - Data Analyst Intern (10 positions)
  - Cloud Engineer - AWS (3 positions)

#### 2. Infosys Limited
- **Size**: 1000+ employees
- **Status**: Verified
- **Website**: https://www.infosys.com
- **Description**: Global leader in next-generation digital services and consulting
- **Open Positions**: 3 jobs (73 positions)
  - Systems Engineer Trainee (50 positions)
  - Digital Specialist Engineer - AI/ML (8 positions)
  - Power Programmer - Summer Internship (15 positions)

#### 3. Reliance Industries
- **Size**: 1000+ employees
- **Status**: Verified
- **Website**: https://www.ril.com
- **Description**: India's largest private sector company
- **Open Positions**: 2 jobs (32 positions)
  - Digital Technology Associate (20 positions)
  - Retail Technology Trainee (12 positions)

#### 4. Flipkart
- **Size**: 1000+ employees
- **Status**: Verified
- **Website**: https://www.flipkart.com
- **Description**: India's leading e-commerce marketplace
- **Open Positions**: 3 jobs (21 positions)
  - Software Development Engineer (10 positions)
  - Frontend Engineer - React (6 positions)
  - UX/UI Design Intern (5 positions)

#### 5. Zoho Corporation
- **Size**: 501-1000 employees
- **Status**: Verified
- **Website**: https://www.zoho.com
- **Description**: Comprehensive suite of business applications
- **Open Positions**: 3 jobs (42 positions)
  - Member Technical Staff (30 positions)
  - Mobile Application Developer (8 positions)
  - Technical Content Writer (4 positions)

## Job Postings Summary

### Total Statistics
- **Total Companies**: 5
- **Total Job Postings**: 14
- **Total Open Positions**: 186
- **Job Types**: Full-time (11), Internship (3)
- **Location Types**: On-site (7), Hybrid (5), Remote (2)

### By Job Type
- **Full-time Jobs**: 11 (163 positions)
- **Internships**: 3 (23 positions)

### By Location
- **Bangalore/Bengaluru**: 7 jobs
- **Mumbai/Navi Mumbai**: 4 jobs
- **Chennai**: 3 jobs
- **Hyderabad**: 1 job
- **Mysore**: 1 job
- **Pune**: 1 job

### By Salary Range (Full-time)
- **₹3-5 LPA**: 2 positions
- **₹5-7 LPA**: 4 positions
- **₹7-10 LPA**: 3 positions
- **₹12-20 LPA**: 2 positions (Premium companies)

### By Salary Range (Internship)
- **₹15,000-20,000/month**: 1 position
- **₹25,000/month**: 1 position
- **₹30,000/month**: 1 position

### Top Required Skills Across All Jobs
1. **Programming Languages**: Java, Python, JavaScript, C++
2. **Web Technologies**: React, Node.js, Spring Boot
3. **Databases**: SQL, MongoDB
4. **Cloud & DevOps**: AWS, Docker, Kubernetes
5. **Emerging Tech**: Machine Learning, AI, Microservices

## Student Demo Data

### Note
For security and data integrity reasons, student accounts must be created through the normal signup flow. 

### Recommended Test Students to Create
You can manually create student accounts with the following profiles for testing:

1. **CS Student - Full Stack Focus**
   - Branch: Computer Science
   - CGPA: 8.5
   - Skills: React, Node.js, MongoDB
   - Year: 4th

2. **IT Student - Cloud Focus**
   - Branch: Information Technology
   - CGPA: 8.7
   - Skills: AWS, Docker, Kubernetes
   - Year: 4th

3. **CS Student - AI/ML Focus**
   - Branch: Computer Science
   - CGPA: 9.1
   - Skills: Python, TensorFlow, Machine Learning
   - Year: 3rd

## How to Test Employer Dashboard

### 1. Login as Employer
```
Email: tcs@demo.com (or any other demo employer)
Password: Demo@123
```

### 2. Verify Dashboard Features
- ✅ View company profile
- ✅ See all job postings
- ✅ View statistics (Total Jobs, Active Jobs, Applications, Pending)
- ✅ Create new job postings
- ✅ View applications (once students apply)
- ✅ Schedule interviews
- ✅ Update application status

### 3. Test Job Creation Flow
1. Click "Post New Job" button
2. Fill in job details
3. Submit and verify job appears in listings
4. Check job status is "active"

### 4. Test AI Matching (Once Students Exist)
1. Go to Job Postings tab
2. Click "AI Match Candidates" on any job
3. System will analyze student profiles and match based on skills
4. View matched candidates in Applications tab

## Features Demonstrated

### Phase 1: Critical Fixes ✅
- [x] Fixed RLS policies for user_roles table
- [x] Enhanced error handling in auth flow
- [x] Added guided onboarding for new employers
- [x] Comprehensive logging for debugging

### Phase 2: Demo Data ✅
- [x] 5 verified employer accounts (top Indian companies)
- [x] 14 diverse job postings
- [x] 186 total open positions
- [x] Mix of full-time and internship opportunities
- [x] Various skill requirements and salary ranges
- [x] Realistic job descriptions and requirements

### Ready for Next Phases
- [ ] Phase 3: Enhanced employer dashboard features
- [ ] Phase 4: Analytics dashboard
- [ ] Phase 5: Job portal integration
- [ ] Phase 6: Employer verification workflow
- [ ] Phase 7: Communication features
- [ ] Phase 8: Mobile responsiveness
- [ ] Phase 9: Security enhancements
- [ ] Phase 10: Testing and optimization

## Testing Checklist

### Employer Dashboard
- [ ] Login with demo employer account
- [ ] Verify company profile displayed correctly
- [ ] Check all statistics are showing
- [ ] View job postings list
- [ ] Create a new job posting
- [ ] Verify job appears in active jobs
- [ ] Test job editing (if implemented)
- [ ] Test job deactivation (if implemented)

### Authentication Flow
- [ ] Test employer signup with new account
- [ ] Verify onboarding flow appears
- [ ] Complete profile setup
- [ ] Verify dashboard loads after onboarding
- [ ] Test logout and login again

### Error Handling
- [ ] Try creating job with missing required fields
- [ ] Verify error messages are user-friendly
- [ ] Check console for proper error logging
- [ ] Test with invalid data inputs

## Known Limitations

1. **No Student Applications Yet**: Applications will appear once students sign up and apply to jobs
2. **No Interview Data**: Interviews can be scheduled once applications exist
3. **Limited Analytics**: Full analytics features planned for Phase 4
4. **No Cross-posting**: External job portal integration planned for Phase 5

## Next Steps for Complete Demo

1. **Create Student Accounts**: 
   - Have 5-10 test students sign up
   - Complete their profiles with diverse skills
   - This will enable testing the full application flow

2. **Generate Applications**:
   - Students should apply to various jobs
   - This will populate the Applications tab
   - Enable testing of AI matching feature

3. **Test Full Workflow**:
   - Employer posts job → Students apply → Employer reviews → Schedule interviews → Make offers

4. **Showcase AI Features**:
   - AI candidate matching
   - Skill gap analysis
   - Career recommendations
   - Placement predictions

## Support

For issues or questions about the demo data:
1. Check console logs for detailed error messages
2. Verify RLS policies are correct
3. Ensure user is properly authenticated
4. Check database constraints are satisfied

## Production Readiness

Before moving to production:
- [ ] Remove or secure demo accounts
- [ ] Implement proper data validation
- [ ] Add rate limiting
- [ ] Set up monitoring and alerts
- [ ] Conduct security audit
- [ ] Perform load testing
- [ ] Set up backup and recovery
- [ ] Document API endpoints
