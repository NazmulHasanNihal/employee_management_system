package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Payroll struct {
	ID         string `json:"id"`
	Month      string `json:"month"`
	Basic      string `json:"basic"`
	Allowance  string `json:"allowance"`
	Deductions string `json:"deductions"`
	Tax        string `json:"tax"`
	Net        string `json:"net"`
}

func main() {
	http.HandleFunc("/generate-payslip", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			User    map[string]string `json:"user"`
			Payroll Payroll           `json:"payroll"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}

		// In a real application, we would use something like gofpdf or wkhtmltopdf here.
		// For the sake of the local prototype, we will return a mock PDF bytes or just a success message.
		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"status": "success",
			"url":    fmt.Sprintf("/pdfs/mock-%s.pdf", payload.Payroll.ID),
		}
		json.NewEncoder(w).Encode(response)
	})

	log.Println("Go Microservice running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
