-- Historical Placement Statistics (3 years of data)
-- Creates realistic placement trends for analytics

-- 2021-2022 Academic Year Data
INSERT INTO public.placement_statistics (
  academic_year,
  department,
  branch,
  total_students,
  placed_students,
  placement_percentage,
  average_package,
  median_package,
  highest_package,
  companies_visited,
  total_offers
) VALUES
('2021-2022', 'Computer Science & Engineering', 'Computer Science', 120, 98, 81.67, 6.5, 6.0, 24.0, 45, 142),
('2021-2022', 'Computer Science & Engineering', 'Information Technology', 80, 62, 77.50, 6.2, 5.8, 18.0, 38, 89),
('2021-2022', 'Electronics & Communication Engineering', 'Electronics & Communication', 100, 72, 72.00, 5.8, 5.5, 15.0, 32, 98),
('2021-2022', 'Mechanical Engineering', 'Mechanical', 90, 58, 64.44, 5.2, 5.0, 12.0, 28, 76),
('2021-2022', 'Civil Engineering', 'Civil', 70, 42, 60.00, 4.8, 4.5, 10.0, 22, 54),
('2021-2022', 'Electrical Engineering', 'Electrical', 75, 51, 68.00, 5.5, 5.2, 13.0, 26, 68);

-- 2022-2023 Academic Year Data (showing growth)
INSERT INTO public.placement_statistics (
  academic_year,
  department,
  branch,
  total_students,
  placed_students,
  placement_percentage,
  average_package,
  median_package,
  highest_package,
  companies_visited,
  total_offers
) VALUES
('2022-2023', 'Computer Science & Engineering', 'Computer Science', 125, 106, 84.80, 7.2, 6.5, 28.0, 52, 168),
('2022-2023', 'Computer Science & Engineering', 'Information Technology', 85, 70, 82.35, 6.8, 6.2, 22.0, 45, 102),
('2022-2023', 'Electronics & Communication Engineering', 'Electronics & Communication', 105, 82, 78.10, 6.2, 5.8, 18.0, 38, 112),
('2022-2023', 'Mechanical Engineering', 'Mechanical', 95, 66, 69.47, 5.6, 5.3, 14.0, 32, 88),
('2022-2023', 'Civil Engineering', 'Civil', 72, 49, 68.06, 5.1, 4.8, 11.0, 25, 62),
('2022-2023', 'Electrical Engineering', 'Electrical', 78, 58, 74.36, 5.9, 5.5, 15.0, 30, 78);

-- 2023-2024 Academic Year Data (continued improvement)
INSERT INTO public.placement_statistics (
  academic_year,
  department,
  branch,
  total_students,
  placed_students,
  placement_percentage,
  average_package,
  median_package,
  highest_package,
  companies_visited,
  total_offers
) VALUES
('2023-2024', 'Computer Science & Engineering', 'Computer Science', 130, 114, 87.69, 7.8, 7.0, 32.0, 58, 192),
('2023-2024', 'Computer Science & Engineering', 'Information Technology', 90, 77, 85.56, 7.4, 6.8, 25.0, 50, 118),
('2023-2024', 'Electronics & Communication Engineering', 'Electronics & Communication', 108, 89, 82.41, 6.8, 6.2, 20.0, 42, 128),
('2023-2024', 'Mechanical Engineering', 'Mechanical', 98, 73, 74.49, 6.0, 5.6, 16.0, 35, 98),
('2023-2024', 'Civil Engineering', 'Civil', 75, 55, 73.33, 5.5, 5.2, 12.5, 28, 72),
('2023-2024', 'Electrical Engineering', 'Electrical', 80, 64, 80.00, 6.3, 5.9, 17.0, 34, 86);

-- Add district-wise breakdown for latest year
INSERT INTO public.placement_statistics (
  academic_year,
  department,
  branch,
  total_students,
  placed_students,
  placement_percentage,
  average_package,
  median_package,
  highest_package,
  companies_visited,
  total_offers
) VALUES
-- Khordha District (includes Bhubaneswar)
('2023-2024', 'Computer Science & Engineering', 'Computer Science - Khordha', 45, 41, 91.11, 8.2, 7.5, 32.0, 58, 68),
-- Cuttack District
('2023-2024', 'Computer Science & Engineering', 'Computer Science - Cuttack', 35, 30, 85.71, 7.5, 6.8, 25.0, 52, 48),
-- Puri District
('2023-2024', 'Computer Science & Engineering', 'Computer Science - Puri', 25, 21, 84.00, 7.2, 6.5, 20.0, 45, 32),
-- Rourkela District
('2023-2024', 'Computer Science & Engineering', 'Computer Science - Sundargarh', 25, 22, 88.00, 7.6, 7.0, 28.0, 50, 36);
