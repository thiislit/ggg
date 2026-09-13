import { GAME_STATE } from '../constants/game.js';

export class GameStateManager {
    constructor(scene) {
        this.scene = scene;
        this.currentState = GAME_STATE.IDLE;
    }

    setState(newState) {
        this.currentState = newState;
        this.scene.events.emit('state-changed', newState);
    }

    getState() {
        return this.currentState;
    }

    is(state) {
        return this.currentState === state;
    }
}
