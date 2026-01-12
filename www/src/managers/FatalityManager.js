import { AudioManager } from './AudioManager.js';

export class FatalityManager {
    constructor(scene) {
        this.scene = scene;
    }

    play(choiceIndex, target, attacker, isPlayerWin, onComplete) {
        // 0: ROCK, 1: PAPER, 2: SCISSORS
        if (choiceIndex === 0) this.playRockFatality(target, attacker, isPlayerWin, onComplete);
        else if (choiceIndex === 1) this.playPaperFatality(target, attacker, isPlayerWin, onComplete);
        else if (choiceIndex === 2) this.playScissorFatality(target, attacker, isPlayerWin, onComplete);
    }

    playRockFatality(target, attacker, isPlayerWin, onComplete) {
        // --- SMASH DE ROCA ---
        AudioManager.playSFX(this.scene, 'fatality_rock');
        this.scene.cameras.main.shake(4000, 0.05); 
        this.scene.cameras.main.flash(500, 255, 255, 255);

        attacker.setDepth(100);
        this.scene.tweens.add({
            targets: attacker,
            scale: 5,
            x: this.scene.scale.width / 2,
            y: this.scene.scale.height / 2,
            duration: 3400,
            ease: 'Back.easeIn',
            onComplete: () => {
                target.setVisible(false);
                if (onComplete) onComplete(isPlayerWin);
            }
        });
    }

    playPaperFatality(target, attacker, isPlayerWin, onComplete) {
        // --- WRAP DE PAPEL ---
        AudioManager.playSFX(this.scene, 'fatality_paper');
        target.setTint(0x888888);
        
        this.scene.tweens.add({
            targets: target,
            scale: 0,
            angle: 720,
            duration: 4500,
            ease: 'Power2',
            onComplete: () => {
                target.setVisible(false);
                if (onComplete) onComplete(isPlayerWin);
            }
        });

        attacker.setDepth(100);
        this.scene.tweens.add({
            targets: attacker,
            scale: 20,
            alpha: 0.5,
            duration: 4500,
        });
    }

    playScissorFatality(target, attacker, isPlayerWin, onComplete) {
        // --- CORTE LETAL ---
        AudioManager.playSFX(this.scene, 'fatality_scissor');
        const slash = this.scene.add.graphics();
        slash.lineStyle(10, 0xffffff);
        slash.beginPath();
        slash.moveTo(target.x - 100, target.y - 100);
        slash.lineTo(target.x + 100, target.y + 100);
        slash.setDepth(200);
        slash.strokePath();
        slash.setAlpha(0);

        this.scene.tweens.add({
            targets: slash,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onStart: () => {
                this.scene.cameras.main.shake(2000, 0.02);
            },
            onComplete: () => {
                slash.destroy();
            }
        });

        this.scene.tweens.add({
            targets: target,
            x: isPlayerWin ? '+=50' : '-=50',
            y: '+=50',
            alpha: 0,
            duration: 3600,
            ease: 'Power1',
            delay: 2100,
            onComplete: () => {
                if (onComplete) onComplete(isPlayerWin);
            }
        });
    }
}
