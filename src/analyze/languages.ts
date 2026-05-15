export interface LanguageConfig {
	extension: string;
	command: string[];
	argsTemplate: (filename: string) => string[];
	envStrip: string[];
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
	javascript: {
		extension: "js",
		command: ["node"],
		argsTemplate: (filename: string) => [filename],
		envStrip: ["NODE_OPTIONS", "NODE_PATH", "NODE_ENV", "require"],
	},
	typescript: {
		extension: "ts",
		command: ["node", "--experimental-strip-types"],
		argsTemplate: (filename: string) => [filename],
		envStrip: ["NODE_OPTIONS", "NODE_PATH", "TS_NODE", "require"],
	},
	python: {
		extension: "py",
		command: ["python3"],
		argsTemplate: (filename: string) => [filename],
		envStrip: ["PYTHONSTARTUP", "PYTHONPATH", "PYTHONHOME", "PYTHONINSPECT", "PYTHONEXECUTABLE"],
	},
	shell: {
		extension: "sh",
		command: ["bash"],
		argsTemplate: (filename: string) => [filename],
		envStrip: ["BASH_ENV", "ENV", "SHELLOPTS", "BASHOPTS"],
	},
};

// 60+ dangerous environment variables to strip
export const DANGEROUS_ENV_VARS: string[] = [
	// Node.js
	"NODE_OPTIONS", "NODE_PATH", "NODE_ENV", "require",
	// Python
	"PYTHONSTARTUP", "PYTHONPATH", "PYTHONHOME", "PYTHONINSPECT", "PYTHONEXECUTABLE", "PYTHONIOENCODING",
	// Shell
	"BASH_ENV", "ENV", "SHELLOPTS", "BASHOPTS",
	// System
	"LD_PRELOAD", "LD_LIBRARY_PATH", "DYLD_INSERT_LIBRARIES", "DYLD_LIBRARY_PATH",
	// Misc
	"PERL5OPT", "PERLLIB", "PERL5LIB",
	"RUBYOPT", "RUBYLIB",
	"JAVA_TOOL_OPTIONS", "JAVA_HOME",
	"GEM_HOME", "GEM_PATH",
	"NPM_CONFIG_PREFIX", "NPM_CONFIG_REGISTRY",
	"YARN_IGNORE_PATH",
	"PNPM_HOME",
	"DEBUG", "DEBUG_COLORS",
	"FORCE_COLOR", "NO_COLOR",
	"HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy",
	"SSL_CERT_FILE", "SSL_CERT_DIR", "CURL_CA_BUNDLE",
	"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_DEFAULT_REGION",
	"AWS_PROFILE", "AWS_CONFIG_FILE", "AWS_SHARED_CREDENTIALS_FILE",
	"GOOGLE_APPLICATION_CREDENTIALS",
	"AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "AZURE_TENANT_ID",
	"GITHUB_TOKEN", "GITLAB_TOKEN",
	"DOCKER_HOST", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH",
	"KUBERNETES_SERVICE_HOST",
	"SSH_AUTH_SOCK",
	"DISPLAY", "WAYLAND_DISPLAY",
	"DBUS_SESSION_BUS_ADDRESS",
	"XDG_RUNTIME_DIR",
	"ELECTRON_RUN_AS_NODE",
];

export function getLanguageConfig(language: string): LanguageConfig | null {
	return LANGUAGE_CONFIGS[language] ?? null;
}

export function sanitizeEnvironment(baseEnv: NodeJS.ProcessEnv, languageConfig: LanguageConfig): NodeJS.ProcessEnv {
	// Allowlist approach: build a clean env from scratch with only known-safe variables.
	// This is more secure than denylisting dangerous vars (which can miss new attack vectors).
	const ALLOWED_VARS: (keyof NodeJS.ProcessEnv)[] = [
		'PATH', 'HOME', 'USER', 'SHELL', 'TERM', 'LANG', 'DBUS_SESSION_BUS_ADDRESS', 'XDG_RUNTIME_DIR',
		'TMPDIR', 'TEMP', 'TMP',
		'PI_SANDBOX_LANGUAGE',
		'npm_config_local_address',
	];

	// Additional per-language safe vars
	const perLangAllowed: (keyof NodeJS.ProcessEnv)[] = [];
	if (languageConfig.command.includes('node') || languageConfig.command.includes('python3')) {
		perLangAllowed.push(
			'npm_config_cache', 'npm_config_prefix',
			'PIP_CACHE_DIR', 'PIP_INDEX_URL',
		);
	}

	const allowed = new Set([...ALLOWED_VARS, ...perLangAllowed]);
	const clean: NodeJS.ProcessEnv = {};
	for (const key of allowed) {
		if (baseEnv[key] !== undefined) {
			clean[key] = baseEnv[key];
		}
	}

	return clean;
}
