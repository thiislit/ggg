import { OnlineCombatUI } from '../ui/OnlineCombatUI.js';
import { GAME_STATE } from '../constants/game.js';

export class OnlineGameScene extends Phaser.Scene {
    constructor() {
        super('OnlineGameScene');
        this.currentState = GAME_STATE.IDLE;
        this.p1Choice = null;
        this.p2Choice = null;
    }

    create(data = {}) {
        const { width, height } = this.scale;
        const p2Name = data.p2Name || 'OPPONENT';

        this.ui = new OnlineCombatUI(this, p2Name);
        this.ui.create(width, height);

        this.ui.onChoiceSelected = (choiceIndex) => {
            if (this.currentState === GAME_STATE.LOCKED) return;
            this.handlePlayerChoice(choiceIndex);
        };
    }

    handlePlayerChoice(choiceIndex) {
        this.p1Choice = choiceIndex;
        this.currentState = GAME_STATE.LOCKED;
        if (this.ui.elements.p1ChoiceDisplay) {
            const emojis = ['✊', '✋', '✌️'];
            this.ui.elements.p1ChoiceDisplay.setText(emojis[choiceIndex]);
        }
    }
}
