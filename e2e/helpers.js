import { expect } from '@playwright/test';

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

/**
 * Prepara la página: tutorial marcado como visto (si no, tapa la partida) y
 * recoge errores de JavaScript para que cada prueba pueda exigir que no haya ninguno.
 */
export async function preparePage(page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('tutorial_seen', 'true');
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // Fallos de red externos (fuentes, Sentry CDN) no son errores del juego
        if (/Failed to load resource|net::ERR_|sentry/i.test(text)) return;
        errors.push(`console.error: ${text}`);
    });
    return errors;
}

/** Abre el juego directamente en el menú principal (parámetro de desarrollo ?scene=menu). */
export async function openMenu(page) {
    await page.goto('/?scene=menu');
    await waitForScene(page, 'MainMenuScene');
}

export async function waitForScene(page, key) {
    await page.waitForFunction((sceneKey) => window.__RPS_GAME__?.scene?.isActive(sceneKey), key, {
        timeout: 30_000,
    });
}

/** Lee algo de una escena activa: fn recibe la escena y devuelve datos serializables. */
export async function readScene(page, key, fn) {
    return page.evaluate(
        ({ sceneKey, source }) => {
            const scene = window.__RPS_GAME__.scene.getScene(sceneKey);
            return new Function('scene', `return (${source})(scene);`)(scene);
        },
        { sceneKey: key, source: fn.toString() }
    );
}

export async function waitForGameState(page, states) {
    const list = Array.isArray(states) ? states : [states];
    await page.waitForFunction(
        (expected) => {
            const scene = window.__RPS_GAME__.scene.getScene('GameScene');
            return scene && expected.includes(scene.currentState);
        },
        list,
        { timeout: 20_000 }
    );
}

/** Toca el lienzo en coordenadas del juego (720x1280), igual que un dedo. */
export async function tapGame(page, x, y) {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(
        box.x + (x * box.width) / GAME_WIDTH,
        box.y + (y * box.height) / GAME_HEIGHT
    );
}

/** Posición de un botón del menú principal (mismo cálculo que MainMenuScene). */
export function menuButtonY(index) {
    return GAME_HEIGHT * 0.32 + index * GAME_HEIGHT * 0.095;
}

export const MENU = { STORY: 0, ONLINE: 1, QUICK_PLAY: 2, PROFILE: 3, OPTIONS: 4 };
