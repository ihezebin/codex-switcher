export function latencyClassName(latency: number) {
  if (latency < 800) return "latency-good";
  if (latency < 2000) return "latency-medium";
  return "latency-bad";
}
