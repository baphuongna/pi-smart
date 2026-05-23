import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerPiSmart } from "./src/extension/register.ts";
export default function (pi: ExtensionAPI): void {
	registerPiSmart(pi);
}
