import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

type ReportType = "placement" | "skill_gap" | "comprehensive";

interface ReportGeneratorProps {
  year?: string;
  department?: string;
  branch?: string;
}

export const ReportGenerator = ({ year, department, branch }: ReportGeneratorProps) => {
  const [reportType, setReportType] = useState<ReportType>("placement");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Fetch analytics data
      const { data: analyticsData, error } = await supabase.functions.invoke('generate-analytics', {
        body: { year, department, branch }
      });

      if (error) throw error;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.text("Placement & Analytics Report", pageWidth / 2, 20, { align: "center" });
      
      // Filters info
      doc.setFontSize(10);
      let yPos = 35;
      doc.text(`Year: ${year || 'All'}`, 20, yPos);
      doc.text(`Department: ${department || 'All'}`, 80, yPos);
      doc.text(`Branch: ${branch || 'All'}`, 140, yPos);
      yPos += 15;

      // Summary Section
      doc.setFontSize(14);
      doc.text("Summary Statistics", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const summary = analyticsData.summary;
      doc.text(`Total Students: ${summary.totalStudents}`, 20, yPos);
      yPos += 7;
      doc.text(`Students Placed: ${summary.totalPlaced}`, 20, yPos);
      yPos += 7;
      doc.text(`Placement Rate: ${summary.overallPlacementRate}%`, 20, yPos);
      yPos += 7;
      doc.text(`Average Package: ₹${summary.avgPackage} LPA`, 20, yPos);
      yPos += 7;
      doc.text(`Highest Package: ₹${summary.highestPackage} LPA`, 20, yPos);
      yPos += 7;
      doc.text(`Companies Visited: ${summary.totalCompanies}`, 20, yPos);
      yPos += 15;

      // Branch-wise Statistics
      if (reportType === "placement" || reportType === "comprehensive") {
        doc.setFontSize(14);
        doc.text("Branch-wise Statistics", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        analyticsData.branchWiseStats.slice(0, 8).forEach((branch: any) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${branch.branch}: ${branch.placedStudents}/${branch.totalStudents} (${branch.placementRate}%)`, 20, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Top Skills in Demand
      if (reportType === "skill_gap" || reportType === "comprehensive") {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text("Top Skills in Demand", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        analyticsData.skillTrends.slice(0, 10).forEach((skill: any) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${skill.name}: Demand ${skill.demand}`, 20, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Skill Gaps
      if (reportType === "skill_gap" || reportType === "comprehensive") {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text("Critical Skill Gaps", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        analyticsData.skillGaps.slice(0, 10).forEach((gap: any) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${gap.name}: Gap Score ${gap.gap}`, 20, yPos);
          yPos += 6;
        });
      }

      // Footer
      const timestamp = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.text(`Generated on: ${timestamp}`, 20, doc.internal.pageSize.getHeight() - 10);

      doc.save(`${reportType}_report_${Date.now()}.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      // Fetch analytics data
      const { data: analyticsData, error } = await supabase.functions.invoke('generate-analytics', {
        body: { year, department, branch }
      });

      if (error) throw error;

      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["Placement & Analytics Report"],
        [""],
        ["Filters"],
        ["Year", year || "All"],
        ["Department", department || "All"],
        ["Branch", branch || "All"],
        [""],
        ["Summary Statistics"],
        ["Total Students", analyticsData.summary.totalStudents],
        ["Students Placed", analyticsData.summary.totalPlaced],
        ["Placement Rate (%)", analyticsData.summary.overallPlacementRate],
        ["Average Package (₹ LPA)", analyticsData.summary.avgPackage],
        ["Highest Package (₹ LPA)", analyticsData.summary.highestPackage],
        ["Companies Visited", analyticsData.summary.totalCompanies],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Branch-wise Statistics Sheet
      if (reportType === "placement" || reportType === "comprehensive") {
        const branchData = [
          ["Branch", "Total Students", "Placed Students", "Placement Rate (%)", "Average Package (₹ LPA)"],
          ...analyticsData.branchWiseStats.map((branch: any) => [
            branch.branch,
            branch.totalStudents,
            branch.placedStudents,
            branch.placementRate,
            branch.averagePackage
          ])
        ];
        const branchSheet = XLSX.utils.aoa_to_sheet(branchData);
        XLSX.utils.book_append_sheet(workbook, branchSheet, "Branch Statistics");
      }

      // Year-wise Trends Sheet
      if (reportType === "placement" || reportType === "comprehensive") {
        const yearData = [
          ["Year", "Placement Rate (%)", "Average Package (₹ LPA)"],
          ...analyticsData.yearWiseTrends.map((year: any) => [
            year.year,
            year.placementRate,
            year.averagePackage
          ])
        ];
        const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
        XLSX.utils.book_append_sheet(workbook, yearSheet, "Year Trends");
      }

      // Top Skills Sheet
      if (reportType === "skill_gap" || reportType === "comprehensive") {
        const skillsData = [
          ["Skill Name", "Demand Score", "Job Postings", "Trend", "Salary Premium (%)"],
          ...analyticsData.skillTrends.map((skill: any) => [
            skill.name,
            skill.demand,
            skill.jobs,
            skill.trend,
            skill.premium
          ])
        ];
        const skillsSheet = XLSX.utils.aoa_to_sheet(skillsData);
        XLSX.utils.book_append_sheet(workbook, skillsSheet, "Top Skills");
      }

      // Skill Gaps Sheet
      if (reportType === "skill_gap" || reportType === "comprehensive") {
        const gapsData = [
          ["Skill Name", "Demand Score", "Student Count", "Gap Score"],
          ...analyticsData.skillGaps.map((gap: any) => [
            gap.name,
            gap.demand,
            gap.studentCount,
            gap.gap
          ])
        ];
        const gapsSheet = XLSX.utils.aoa_to_sheet(gapsData);
        XLSX.utils.book_append_sheet(workbook, gapsSheet, "Skill Gaps");
      }

      // Detailed Placement Data Sheet
      if (analyticsData.placementStats && analyticsData.placementStats.length > 0) {
        const placementData = [
          ["Year", "Department", "Branch", "Total Students", "Placed", "Avg Package", "Highest Package", "Companies"],
          ...analyticsData.placementStats.map((stat: any) => [
            stat.academic_year,
            stat.department,
            stat.branch,
            stat.total_students,
            stat.placed_students,
            stat.average_package,
            stat.highest_package,
            stat.companies_visited
          ])
        ];
        const placementSheet = XLSX.utils.aoa_to_sheet(placementData);
        XLSX.utils.book_append_sheet(workbook, placementSheet, "Detailed Data");
      }

      XLSX.writeFile(workbook, `${reportType}_report_${Date.now()}.xlsx`);
      toast.success("Excel report generated successfully");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
        <CardDescription>
          Export analytics data as PDF or Excel files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placement">Placement Report</SelectItem>
              <SelectItem value="skill_gap">Skill Gap Analysis</SelectItem>
              <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex-1"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
          <Button
            onClick={generateExcel}
            disabled={isGenerating}
            variant="outline"
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
