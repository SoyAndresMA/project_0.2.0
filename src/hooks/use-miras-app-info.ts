import packageJson from '../../package.json';

interface MirasAppInfo {
    name: string;
    version: string;
}

export function useMirasAppInfo(): MirasAppInfo {
    return {
        name: packageJson.name,
        version: packageJson.version
    };
}
