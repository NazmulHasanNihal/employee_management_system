import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TelemetryService, PayrollService } from "../gen/ems_connect";

const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_GO_BACKEND_URL || "http://localhost:8080",
});

export const telemetryClient = createPromiseClient(TelemetryService, transport);
export const payrollClient = createPromiseClient(PayrollService, transport);
