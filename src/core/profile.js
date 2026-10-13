import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = path.resolve(__dirname, '../../templates/os_profiles.json');

export function loadOSProfile(profileKey = 'linux_x86_64_chrome') {
  if (!fs.existsSync(TEMPLATES_PATH)) {
    throw new Error(`Profile template not found at ${TEMPLATES_PATH}`);
  }
  const profiles = JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf-8'));
  const profile = profiles[profileKey];
  if (!profile) {
    throw new Error(`Unknown OS Profile: ${profileKey}. Available: ${Object.keys(profiles).join(', ')}`);
  }
  return profile;
}
