package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type EngineRequest struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body,omitempty"`
	Timeout int               `json:"timeout_ms,omitempty"`
}

type EngineResponse struct {
	StatusCode int                 `json:"status_code"`
	Headers    map[string][]string `json:"headers"`
	Body       string              `json:"body"`
	DurationMS int64               `json:"duration_ms"`
}

func main() {
	mode := flag.String("mode", "cli", "Execution mode: cli | server")
	flag.Parse()

	if *mode == "cli" {
		input, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to read stdin: %v\n", err)
			os.Exit(1)
		}

		var req EngineRequest
		if err := json.Unmarshal(input, &req); err != nil {
			fmt.Fprintf(os.Stderr, "invalid json payload: %v\n", err)
			os.Exit(1)
		}

		res := executeRequest(req)
		out, _ := json.Marshal(res)
		fmt.Println(string(out))
	}
}

func executeRequest(req EngineRequest) EngineResponse {
	start := time.Now()
	timeout := 20 * time.Second
	if req.Timeout > 0 {
		timeout = time.Duration(req.Timeout) * time.Millisecond
	}

	client := &http.Client{
		Timeout: timeout,
	}

	httpReq, err := http.NewRequest(req.Method, req.URL, nil)
	if err != nil {
		return EngineResponse{StatusCode: 500, Body: err.Error()}
	}

	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	resp, err := client.Do(httpReq)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return EngineResponse{StatusCode: 502, Body: err.Error(), DurationMS: duration}
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	return EngineResponse{
		StatusCode: resp.StatusCode,
		Headers:    resp.Header,
		Body:       string(bodyBytes),
		DurationMS: duration,
	}
}
