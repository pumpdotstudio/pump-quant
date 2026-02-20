/* ================================================================== */
/*  Pump Studio Agent — Terminal logger                                */
/*                                                                     */
/*  Colored output matching the Pump Studio dark terminal aesthetic.    */
/*  Green #22c55e for success, red for errors, yellow for warnings,    */
/*  dim gray for metadata.                                             */
/* ================================================================== */

/* ANSI escape codes */
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[38;2;34;197;94m";    /* #22c55e — brand green */
const RED = "\x1b[38;2;239;68;68m";      /* #ef4444 */
const YELLOW = "\x1b[38;2;234;179;8m";   /* #eab308 */
const GRAY = "\x1b[38;2;113;113;122m";   /* #71717a */
const WHITE = "\x1b[38;2;229;231;235m";  /* #e5e7eb */
const CYAN = "\x1b[38;2;34;211;238m";    /* #22d3ee */

const VERSION = "0.1.0";

export function banner(): void {
  const art = `
${GREEN}${BOLD}  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║   ██████╗ ██╗   ██╗███╗   ███╗██████╗               ║
  ║   ██╔══██╗██║   ██║████╗ ████║██╔══██╗              ║
  ║   ██████╔╝██║   ██║██╔████╔██║██████╔╝              ║
  ║   ██╔═══╝ ██║   ██║██║╚██╔╝██║██╔═══╝               ║
  ║   ██║     ╚██████╔╝██║ ╚═╝ ██║██║                   ║
  ║   ╚═╝      ╚═════╝ ╚═╝     ╚═╝╚═╝                   ║
  ║                                                      ║
  ║   ${WHITE}S T U D I O   A G E N T${GREEN}   v${VERSION}               ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝${RESET}

  ${GRAY}The intelligence layer for Pump.fun${RESET}
  ${GRAY}https://pump.studio/agents${RESET}
`;
  process.stdout.write(art + "\n");
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function step(label: string, message: string): void {
  process.stdout.write(
    `  ${CYAN}${BOLD}●${RESET} ${DIM}${timestamp()}${RESET}  ${WHITE}${label.padEnd(12)}${RESET} ${message}\n`
  );
}

export function success(label: string, message: string): void {
  process.stdout.write(
    `  ${GREEN}${BOLD}✓${RESET} ${DIM}${timestamp()}${RESET}  ${GREEN}${label.padEnd(12)}${RESET} ${message}\n`
  );
}

export function warn(label: string, message: string): void {
  process.stdout.write(
    `  ${YELLOW}${BOLD}!${RESET} ${DIM}${timestamp()}${RESET}  ${YELLOW}${label.padEnd(12)}${RESET} ${message}\n`
  );
}

export function fail(label: string, message: string): void {
  process.stdout.write(
    `  ${RED}${BOLD}✗${RESET} ${DIM}${timestamp()}${RESET}  ${RED}${label.padEnd(12)}${RESET} ${message}\n`
  );
}

export function info(message: string): void {
  process.stdout.write(`  ${GRAY}  ${message}${RESET}\n`);
}

export function divider(): void {
  process.stdout.write(`  ${GRAY}${"─".repeat(56)}${RESET}\n`);
}

export function result(label: string, value: string | number): void {
  process.stdout.write(
    `  ${GRAY}  ${label.padEnd(18)}${RESET}${WHITE}${value}${RESET}\n`
  );
}

export function keyValue(label: string, value: string | number | boolean | null | undefined): void {
  const display = value === null || value === undefined ? "-" : String(value);
  process.stdout.write(
    `  ${GRAY}  ${label.padEnd(18)}${RESET}${display}\n`
  );
}

export function blank(): void {
  process.stdout.write("\n");
}

export function important(message: string): void {
  process.stdout.write(`\n  ${YELLOW}${BOLD}>>> ${message}${RESET}\n\n`);
}
