package main

import (
	"fmt"
	"log"
	"os"

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

// requireAuth validates the incoming Bearer token against the configured secret.
func requireAuth(c *fiber.Ctx, authToken string) error {
	authHeader := c.Get("Authorization")
	if authHeader != "Bearer "+authToken {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized access"})
	}
	return nil
}

func main() {
	app := fiber.New()

	// Auth token and allowed CORS origin are environment-driven.
	// PAYROLL_API_TOKEN is REQUIRED — the service refuses to start without it.
	authToken := os.Getenv("PAYROLL_API_TOKEN")
	if authToken == "" {
		log.Fatal("PAYROLL_API_TOKEN environment variable is required")
	}
	corsOrigin := os.Getenv("PAYROLL_CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:3000"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigin,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Post("/api/payroll/generate-payslip", func(c *fiber.Ctx) error {
		// Basic Auth Check
		if err := requireAuth(c, authToken); err != nil {
			return err
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

	type AttendanceRecord struct {
		Date       string `json:"date"`
		Employee   string `json:"employee"`
		Status     string `json:"status"`
		ClockIn    string `json:"clockIn"`
		ClockOut   string `json:"clockOut"`
	}

	app.Post("/api/reports/attendance-pdf", func(c *fiber.Ctx) error {
		if err := requireAuth(c, authToken); err != nil {
			return err
		}

		var records []AttendanceRecord
		if err := c.BodyParser(&records); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
		}

		pdf := fpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		
		pdf.SetFont("Arial", "B", 18)
		pdf.CellFormat(0, 10, "Corporate Attendance Report", "", 1, "C", false, 0, "")
		pdf.Ln(10)
		
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(30, 10, "Date", "1", 0, "C", false, 0, "")
		pdf.CellFormat(55, 10, "Employee Name", "1", 0, "C", false, 0, "")
		pdf.CellFormat(25, 10, "Status", "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, "Clock In", "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, "Clock Out", "1", 1, "C", false, 0, "")
		
		pdf.SetFont("Arial", "", 11)
		
		for _, row := range records {
			pdf.CellFormat(30, 10, row.Date, "1", 0, "C", false, 0, "")
			pdf.CellFormat(55, 10, row.Employee, "1", 0, "L", false, 0, "")
			pdf.CellFormat(25, 10, row.Status, "1", 0, "C", false, 0, "")
			pdf.CellFormat(40, 10, row.ClockIn, "1", 0, "C", false, 0, "")
			pdf.CellFormat(40, 10, row.ClockOut, "1", 1, "C", false, 0, "")
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
