package main

import (
	"fmt"
	"log"

	"github.com/go-pdf/fpdf"
	"github.com/gofiber/fiber/v2"
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

	app.Post("/api/payroll/generate-payslip", func(c *fiber.Ctx) error {
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

	log.Fatal(app.Listen(":8080"))
}
