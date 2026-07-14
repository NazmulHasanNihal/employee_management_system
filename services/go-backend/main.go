package main

import (
	"fmt"
	"log"

	"github.com/go-pdf/fpdf"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

type PayrollRequest struct {
	UserID       string  `json:"userId"`
	Month        string  `json:"month"`
	BaseSalary   float64 `json:"baseSalary"`
	NetSalary    float64 `json:"netSalary"`
	TaxDeduction float64 `json:"taxDeduction"`
}

func main() {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Post("/api/payroll/generate-payslip", func(c *fiber.Ctx) error {
		// Basic Auth Check
		authHeader := c.Get("Authorization")
		if authHeader != "Bearer shared_secret_token_123" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized access"})
		}

		req := new(PayrollRequest)
		if err := c.BodyParser(req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
		}

		pdf := fpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 16)
		pdf.Cell(40, 10, "Official Payslip")
		pdf.Ln(10)

		pdf.SetFont("Arial", "", 12)
		pdf.Cell(40, 10, fmt.Sprintf("Employee ID: %s", req.UserID))
		pdf.Ln(8)
		pdf.Cell(40, 10, fmt.Sprintf("Month: %s", req.Month))
		pdf.Ln(8)
		pdf.Cell(40, 10, fmt.Sprintf("Base Salary: $%.2f", req.BaseSalary))
		pdf.Ln(8)
		pdf.Cell(40, 10, fmt.Sprintf("Tax Deduction: $%.2f", req.TaxDeduction))
		pdf.Ln(8)
		pdf.Cell(40, 10, fmt.Sprintf("Net Pay: $%.2f", req.NetSalary))

		// In a real app we'd save to Supabase Storage, but here we'll just stream it back
		c.Set("Content-Type", "application/pdf")
		c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=payslip-%s.pdf", req.Month))

		err := pdf.Output(c.Response().BodyWriter())
		if err != nil {
			return c.Status(500).SendString("Failed to generate PDF")
		}

		return nil
	})

	app.Get("/api/reports/attendance-pdf", func(c *fiber.Ctx) error {
		pdf := fpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		
		pdf.SetFont("Arial", "B", 18)
		pdf.CellFormat(0, 10, "Corporate Attendance Report", "", 1, "C", false, 0, "")
		pdf.Ln(10)
		
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(40, 10, "Date", "1", 0, "C", false, 0, "")
		pdf.CellFormat(60, 10, "Employee Name", "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, "Status", "1", 0, "C", false, 0, "")
		pdf.CellFormat(50, 10, "Clock In", "1", 1, "C", false, 0, "")
		
		pdf.SetFont("Arial", "", 11)
		
		// Mock data for now, ideally fetch from DB
		mockData := [][]string{
			{"2026-07-14", "Sarah Connor", "Present", "08:55 AM"},
			{"2026-07-14", "John Doe", "Late", "09:30 AM"},
			{"2026-07-13", "Alice Smith", "Present", "09:00 AM"},
			{"2026-07-13", "Bob Wilson", "Present", "08:45 AM"},
		}

		for _, row := range mockData {
			pdf.CellFormat(40, 10, row[0], "1", 0, "C", false, 0, "")
			pdf.CellFormat(60, 10, row[1], "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 10, row[2], "1", 0, "C", false, 0, "")
			pdf.CellFormat(50, 10, row[3], "1", 1, "C", false, 0, "")
		}

		c.Set("Content-Type", "application/pdf")
		c.Set("Content-Disposition", "attachment; filename=attendance_report.pdf")

		err := pdf.Output(c.Response().BodyWriter())
		if err != nil {
			return c.Status(500).SendString("Failed to generate PDF")
		}
		return nil
	})

	log.Fatal(app.Listen(":8080"))
}
