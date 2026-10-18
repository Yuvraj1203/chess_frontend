export const THEME_STORAGE_KEY = "theme";

/**
 * Runs inline in <head> before paint so the page never flashes the wrong
 * theme: saved choice first, else the OS preference.
 */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;
