-- Insert sample courses for various skills and career domains
INSERT INTO public.courses (title, description, provider, level, duration, price, rating, skills_covered, url) VALUES
-- Programming & Development
('Full Stack Web Development Bootcamp', 'Complete web development course covering HTML, CSS, JavaScript, React, Node.js, and databases', 'Udemy', 'beginner', '40 hours', '$79.99', 4.7, ARRAY['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB'], 'https://www.udemy.com/course/the-complete-web-development-bootcamp/'),
('Python for Data Science', 'Learn Python programming for data analysis, visualization, and machine learning', 'Coursera', 'intermediate', '35 hours', 'Free (Audit)', 4.6, ARRAY['Python', 'Pandas', 'NumPy', 'Data Analysis', 'Machine Learning'], 'https://www.coursera.org/specializations/python-data-science'),
('Java Programming Masterclass', 'Comprehensive Java course from basics to advanced OOP concepts', 'Udemy', 'beginner', '80 hours', '$89.99', 4.5, ARRAY['Java', 'OOP', 'Spring Boot', 'Algorithms'], 'https://www.udemy.com/course/java-the-complete-java-developer-course/'),

-- Machine Learning & AI
('Machine Learning Specialization', 'Stanford course covering supervised learning, unsupervised learning, and best practices', 'Coursera', 'intermediate', '50 hours', '$49/month', 4.9, ARRAY['Machine Learning', 'Python', 'TensorFlow', 'Neural Networks'], 'https://www.coursera.org/specializations/machine-learning-introduction'),
('Deep Learning with PyTorch', 'Build neural networks and deep learning models using PyTorch', 'Udacity', 'advanced', '30 hours', '$399', 4.7, ARRAY['Deep Learning', 'PyTorch', 'Neural Networks', 'Computer Vision'], 'https://www.udacity.com/course/deep-learning-pytorch--ud188'),
('Natural Language Processing', 'Learn NLP techniques including text processing, sentiment analysis, and transformers', 'Coursera', 'advanced', '45 hours', '$49/month', 4.6, ARRAY['NLP', 'Python', 'Transformers', 'BERT'], 'https://www.coursera.org/specializations/natural-language-processing'),

-- Cloud & DevOps
('AWS Certified Solutions Architect', 'Prepare for AWS certification while learning cloud architecture', 'A Cloud Guru', 'intermediate', '25 hours', '$299', 4.8, ARRAY['AWS', 'Cloud Computing', 'Architecture', 'S3', 'EC2'], 'https://acloudguru.com/course/aws-certified-solutions-architect-associate'),
('Docker and Kubernetes Complete Guide', 'Master containerization and orchestration with Docker and Kubernetes', 'Udemy', 'intermediate', '22 hours', '$74.99', 4.7, ARRAY['Docker', 'Kubernetes', 'DevOps', 'Containers'], 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/'),
('CI/CD with Jenkins and GitLab', 'Learn continuous integration and deployment pipelines', 'Pluralsight', 'intermediate', '15 hours', '$29/month', 4.5, ARRAY['Jenkins', 'GitLab', 'CI/CD', 'DevOps', 'Git'], 'https://www.pluralsight.com/paths/continuous-integration-and-continuous-delivery'),

-- Data Science & Analytics
('Data Science Career Track', 'Complete path from beginner to job-ready data scientist', 'DataCamp', 'beginner', '100 hours', '$25/month', 4.6, ARRAY['Python', 'SQL', 'Data Visualization', 'Statistics', 'Machine Learning'], 'https://www.datacamp.com/tracks/data-scientist-with-python'),
('SQL for Data Analysis', 'Master SQL queries, joins, and database optimization', 'Mode Analytics', 'beginner', '12 hours', 'Free', 4.7, ARRAY['SQL', 'Database', 'Data Analysis', 'PostgreSQL'], 'https://mode.com/sql-tutorial/'),
('Tableau for Data Visualization', 'Create interactive dashboards and tell stories with data', 'Tableau Learning', 'beginner', '18 hours', 'Free', 4.5, ARRAY['Tableau', 'Data Visualization', 'Analytics', 'Dashboards'], 'https://www.tableau.com/learn/training'),

-- Mobile Development
('iOS Development with Swift', 'Build native iOS apps with Swift and SwiftUI', 'Apple Developer', 'intermediate', '40 hours', 'Free', 4.8, ARRAY['Swift', 'iOS', 'SwiftUI', 'Xcode'], 'https://developer.apple.com/tutorials/swiftui'),
('Android Development with Kotlin', 'Create Android apps using modern Kotlin', 'Google Developers', 'intermediate', '35 hours', 'Free', 4.7, ARRAY['Kotlin', 'Android', 'Mobile Development', 'Android Studio'], 'https://developer.android.com/courses'),
('React Native - The Practical Guide', 'Build cross-platform mobile apps with React Native', 'Udemy', 'intermediate', '32 hours', '$84.99', 4.6, ARRAY['React Native', 'JavaScript', 'Mobile Development', 'iOS', 'Android'], 'https://www.udemy.com/course/react-native-the-practical-guide/'),

-- Web Development
('Advanced React and Redux', 'Master React patterns, Redux, and modern JavaScript', 'Udemy', 'advanced', '28 hours', '$79.99', 4.7, ARRAY['React', 'Redux', 'JavaScript', 'TypeScript'], 'https://www.udemy.com/course/react-redux/'),
('Node.js Complete Developer Course', 'Build scalable backend applications with Node.js', 'Udemy', 'intermediate', '35 hours', '$74.99', 4.6, ARRAY['Node.js', 'Express', 'MongoDB', 'REST API'], 'https://www.udemy.com/course/the-complete-nodejs-developer-course/'),
('Modern JavaScript from the Beginning', 'Learn ES6+, async programming, and JavaScript best practices', 'Udemy', 'beginner', '21 hours', '$69.99', 4.5, ARRAY['JavaScript', 'ES6', 'Async Programming', 'DOM'], 'https://www.udemy.com/course/modern-javascript-from-the-beginning/'),

-- Cybersecurity
('Ethical Hacking Course', 'Learn penetration testing and security assessment', 'Cybrary', 'intermediate', '30 hours', '$399', 4.6, ARRAY['Ethical Hacking', 'Penetration Testing', 'Security', 'Networking'], 'https://www.cybrary.it/course/ethical-hacking/'),
('CompTIA Security+ Certification', 'Prepare for Security+ certification exam', 'Professor Messer', 'beginner', '20 hours', 'Free', 4.8, ARRAY['Security', 'Networking', 'Cryptography', 'Risk Management'], 'https://www.professormesser.com/security-plus/sy0-601/sy0-601-video/'),

-- Soft Skills & Management
('Project Management Professional (PMP)', 'Comprehensive PMP exam preparation', 'PMI', 'advanced', '35 hours', '$299', 4.7, ARRAY['Project Management', 'Leadership', 'Risk Management', 'Agile'], 'https://www.pmi.org/learning/training-development'),
('Communication Skills Masterclass', 'Improve public speaking, presentations, and interpersonal skills', 'Udemy', 'beginner', '12 hours', '$59.99', 4.6, ARRAY['Communication', 'Public Speaking', 'Presentation Skills', 'Leadership'], 'https://www.udemy.com/course/communication-skills-machine/'),
('Agile Scrum Master Certification', 'Become a certified Scrum Master and learn Agile methodologies', 'Scrum Alliance', 'intermediate', '16 hours', '$1,200', 4.8, ARRAY['Scrum', 'Agile', 'Project Management', 'Team Leadership'], 'https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster')
ON CONFLICT DO NOTHING;