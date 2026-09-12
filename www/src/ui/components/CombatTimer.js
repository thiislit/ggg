import { CONFIG } from '../../data/config.js';
import { LAYOUT } from '../../data/Layout.js';

/** Visualización y ciclo de vida de las barras de tiempo de una ronda. */
export class CombatTimer {
    constructor(scene, elements) {
        this.scene = scene;
        this.elements = elements;
    }

    init(width, barY) {
        const barWidth = width * 0.4;
        const barHeight = 20;
        const centerX = width / 2;
        const centerY = barY - 40;
        const radius = 77;
        const drawPath = (graphics, isLeft) => {
            const top = barY - barHeight / 2;
            const bottom = barY + barHeight / 2;
            const deltaTop = Math.sqrt(radius ** 2 - (top - centerY) ** 2);
            const topAngle = Math.asin((top - centerY) / radius);
            const bottomAngle = Math.asin((bottom - centerY) / radius);
            const startX = isLeft ? centerX - barWidth - 20 : centerX + barWidth + 20;
            const arcTopX = isLeft ? centerX - deltaTop : centerX + deltaTop;
            graphics.beginPath().moveTo(startX, top).lineTo(arcTopX, top);
            if (isLeft)
                graphics.arc(
                    centerX,
                    centerY,
                    radius,
                    Math.PI - topAngle,
                    Math.PI - bottomAngle,
                    true
                );
            else graphics.arc(centerX, centerY, radius, topAngle, bottomAngle, false);
            graphics.lineTo(startX, bottom).closePath().fillPath().strokePath();
        };

        this.elements.barLeftBg = this.scene.add
            .graphics()
            .setDepth(100)
            .fillStyle(0x000000, 0.5)
            .lineStyle(2, CONFIG.THEME.primary, 0.5);
        drawPath(this.elements.barLeftBg, true);
        this.elements.barRightBg = this.scene.add
            .graphics()
            .setDepth(100)
            .fillStyle(0x000000, 0.5)
            .lineStyle(2, CONFIG.THEME.primary, 0.5);
        drawPath(this.elements.barRightBg, false);
        this.elements.maskLeft = this.scene.add.graphics().setVisible(false).fillStyle(0xffffff);
        this.elements.maskRight = this.scene.add.graphics().setVisible(false).fillStyle(0xffffff);
        drawPath(this.elements.maskLeft, true);
        drawPath(this.elements.maskRight, false);
        this.elements.timeBar1 = this.scene.add
            .rectangle(0, barY, barWidth, barHeight, CONFIG.THEME.primary)
            .setDepth(101);
        this.elements.timeBar2 = this.scene.add
            .rectangle(0, barY, barWidth, barHeight, CONFIG.THEME.primary)
            .setDepth(101);
        const style = {
            fontSize: '12px',
            fontFamily: CONFIG.FONTS.MAIN,
            fill: CONFIG.THEME.primaryStr,
        };
        this.elements.timeText1 = this.scene.add
            .text(LAYOUT.getColumnX(width, false), barY - 20, 'READY', style)
            .setOrigin(0.5)
            .setDepth(102);
        this.elements.timeText2 = this.scene.add
            .text(LAYOUT.getColumnX(width, true), barY - 20, 'READY', style)
            .setOrigin(0.5)
            .setDepth(102);
    }

    updatePositions(isPlayerRight, width) {
        const { timeBar1, timeBar2, maskLeft, maskRight } = this.elements;
        if (isPlayerRight) {
            timeBar1
                .setOrigin(0, 0.5)
                .setX(width * 0.5 + 20)
                .setMask(maskRight.createGeometryMask());
            timeBar2
                .setOrigin(1, 0.5)
                .setX(width * 0.5 - 20)
                .setMask(maskLeft.createGeometryMask());
        } else {
            timeBar1
                .setOrigin(1, 0.5)
                .setX(width * 0.5 - 20)
                .setMask(maskLeft.createGeometryMask());
            timeBar2
                .setOrigin(0, 0.5)
                .setX(width * 0.5 + 20)
                .setMask(maskRight.createGeometryMask());
        }
    }

    start(duration, onTimeout) {
        this.scene.tweens.add({
            targets: [this.elements.timeBar1, this.elements.timeBar2],
            scaleX: 0,
            duration,
            onUpdate: (tween) => {
                const remaining = Math.ceil((1 - tween.progress) * 5);
                this.elements.timeText1.setText(`${remaining}s`);
                this.elements.timeText2.setText(`${remaining}s`);
                if (tween.progress > 0.7) {
                    this.elements.timeBar1.setFillStyle(0xff0000);
                    this.elements.timeBar2.setFillStyle(0xff0000);
                }
            },
            onComplete: onTimeout,
        });
    }

    stop() {
        this.scene.tweens.killTweensOf([this.elements.timeBar1, this.elements.timeBar2]);
    }
}
