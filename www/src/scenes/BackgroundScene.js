import { CONFIG } from '../config.js';

export class BackgroundScene extends Phaser.Scene {
    constructor() {
        super('BackgroundScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
        
        // --- MODO IMAGEN ESTÁTICA ---
        // Centramos la imagen para que el "palpitar" sea simétrico
        this.bgStatic = this.add.image(width / 2, height / 2, 'v3_bg');
        
        // Aplicamos un tinte verdoso muy sutil para efecto terminal
        this.bgStatic.setTint(0x88ff88);
        
        // Forzamos el tamaño inicial para llenar la pantalla
        this.bgStatic.setDisplaySize(width, height);
        this.bgStatic.setDepth(-100);

        // --- ANIMACIÓN DE PALPITAR (EFECTO RESPIRACIÓN) ---
        // 1. Escala: Crece un 4% de forma más fluida
        this.tweens.add({
            targets: this.bgStatic,
            scale: this.bgStatic.scale * 1.04,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Brillo: Ciclo más corto para dar vida
        this.tweens.add({
            targets: this.bgStatic,
            alpha: 0.85,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        /* 
        // --- MODO ANIMADO (COMENTADO PARA RESPALDO) ---
        // Evitar error de textura duplicada al reiniciar la escena
        if (this.textures.exists('spaceBackground')) {
            this.textures.remove('spaceBackground');
        }

        // Crear una textura dinámica basada en Canvas
        this.canvasTexture = this.textures.createCanvas('spaceBackground', width, height);
        this.ctx = this.canvasTexture.getContext();
        
        // Inicializar nuestros sistemas (copiado y adaptado del Lab)
        this.particles = [];
        this.planets = [];
        this.nebula = [];
        
        // 1. Fondo Estático (Lo pintamos una vez en un canvas separado en memoria)
        this.staticBg = document.createElement('canvas');
        this.staticBg.width = width;
        this.staticBg.height = height;
        const staticCtx = this.staticBg.getContext('2d');
        this.createStaticStarfield(staticCtx, width, height);

        // 2. Crear elementos dinámicos
        this.createNebula(width, height);
        this.createPlanets(width, height);
        this.createParticles(width, height);

        // Añadir la imagen al mundo (es lo que se verá)
        this.bgImage = this.add.image(0, 0, 'spaceBackground').setOrigin(0);
        this.bgImage.setDepth(-100); 
        */
    }

    update(time, delta) {
        /*
        // --- ACTUALIZACIÓN MODO ANIMADO (COMENTADO) ---
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Limpiar y pintar fondo estático
        this.ctx.drawImage(this.staticBg, 0, 0);

        // 2. Actualizar y Dibujar Nebulosa
        this.updateAndDrawNebula(width, height);

        // 3. Actualizar y Dibujar Planetas
        this.updateAndDrawPlanets(width, height);

        // 4. Actualizar y Dibujar Partículas
        this.updateAndDrawParticles(width, height);

        // ¡Importante! Decirle a Phaser que la textura cambió
        this.canvasTexture.refresh();
        */
    }

    // --- LÓGICA DEL LABORATORIO ADAPTADA ---

    createStaticStarfield(ctx, w, h) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        for(let i=0; i<1000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const isBright = Math.random() > 0.95;
            const radius = isBright ? 1.5 : 0.5;
            const alpha = isBright ? 0.4 : 0.15;
            const glowScale = isBright ? 6 : 3;

            const g = ctx.createRadialGradient(x, y, 0, x, y, radius * glowScale);
            g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, radius * glowScale, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    createNebula(w, h) {
        const count = 8; 
        for(let i=0; i<count; i++) {
            const colors = ['rgba(100, 0, 150, 0.03)', 'rgba(0, 50, 100, 0.03)', 'rgba(50, 0, 50, 0.03)'];
            this.nebula.push({
                x: Math.random() * w,
                y: Math.random() * h,
                baseX: Math.random() * w,
                radius: 300 + Math.random() * 400,
                speed: 0.02 + Math.random() * 0.05,
                color: colors[Math.floor(Math.random() * colors.length)],
                offset: Math.random() * 100
            });
        }
    }

    createPlanets(w, h) {
        const count = 400; 
        for(let i=0; i<count; i++) {
            const colors = ['#FFFFFF', '#FFFFFF', '#FF00FF', '#00FFFF', '#FFFF00']; 
            const color = colors[Math.floor(Math.random() * colors.length)];
            const isDistant = Math.random() > 0.15;
            const radius = isDistant ? 0.3 + Math.random() : 2 + Math.random() * 3;
            const speed = isDistant ? 0.005 + Math.random() * 0.01 : 0.02 + Math.random() * 0.03;
            
            this.planets.push({
                baseX: Math.random() * w,
                x: 0,
                y: Math.random() * h,
                radius: radius,
                speed: speed,
                color: color,
                offset: Math.random() * 100
            });
        }
    }

    createParticles(w, h) {
        const count = 120;
        for(let i=0; i<count; i++) {
            const palette = ['155, 89, 182', '243, 156, 18', '231, 76, 60', '142, 68, 173', '255, 255, 255', '241, 196, 15'];
            const color = palette[Math.floor(Math.random() * palette.length)];
            
            // Simplificamos: Ya no hay tipos complejos, solo partículas simples
            const isFaint = Math.random() < 0.2;
            let size = 1 + Math.random() * 2; // Tamaño variado pero pequeño
            let speed = 0.05 + Math.random() * 0.1;
            let baseAlpha = isFaint ? 0.2 : 0.6;

            this.particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                driftX: (Math.random() - 0.5) * 0.1,
                speed: speed, 
                size: size, 
                baseAlpha: baseAlpha, 
                alpha: baseAlpha,
                blinkSpeed: Math.random() * 0.05,
                offset: Math.random() * 100,
                color: color
            });
        }
    }

    updateAndDrawNebula(w, h) {
        this.ctx.save();
        this.nebula.forEach(n => {
            n.y -= n.speed;
            n.x = n.baseX + Math.sin(n.y * 0.002 + n.offset) * 50; 
            if (n.y < -n.radius * 2) { n.y = h + n.radius * 2; n.baseX = Math.random() * w; }

            const g = this.ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
            g.addColorStop(0, n.color);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = g;
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    updateAndDrawPlanets(w, h) {
        this.ctx.save();
        this.planets.forEach((p, index) => {
            p.y -= p.speed;
            p.x = p.baseX + Math.sin(p.y * 0.005 + p.offset) * 10;
            if (p.y < -p.radius * 2) { p.y = h + p.radius * 2; p.baseX = Math.random() * w; }

            const isFlare = index % 2 === 0;
            if (isFlare && p.radius > 1) {
                const flareSize = p.radius * 1.8;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x - flareSize, p.y);
                this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - flareSize);
                this.ctx.quadraticCurveTo(p.x, p.y, p.x + flareSize, p.y);
                this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + flareSize);
                this.ctx.quadraticCurveTo(p.x, p.y, p.x - flareSize, p.y);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                if (p.radius > 2) {
                    const glowSize = p.radius * 4;
                    const g = this.ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, glowSize);
                    g.addColorStop(0, p.color);
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    this.ctx.fillStyle = g;
                    this.ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                } else {
                    this.ctx.fillStyle = p.color;
                    this.ctx.arc(Math.floor(p.x), Math.floor(p.y), p.radius, 0, Math.PI * 2);
                }
                this.ctx.fill();
            }
        });
        this.ctx.restore();
    }

    updateAndDrawParticles(w, h) {
        this.particles.forEach(p => {
            p.y -= p.speed; 
            p.x += p.driftX;
            p.alpha = p.baseAlpha + Math.sin(Date.now() * p.blinkSpeed + p.offset) * 0.2;
            if (p.alpha < 0.1) p.alpha = 0.1;
            if (p.alpha > 1) p.alpha = 1;
            
            // Loop infinito
            if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;

            // Dibujar como círculos suaves (estrellas) en lugar de cuadrados/malla
            const x = p.x;
            const y = p.y;
            const s = p.size;
            
            // Glow suave
            // const g = this.ctx.createRadialGradient(x, y, 0, x, y, s * 2);
            // g.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
            // g.addColorStop(1, 'rgba(0,0,0,0)');
            // this.ctx.fillStyle = g;
            
            // Por rendimiento, usamos círculos sólidos con fillStyle directo (más rápido que gradientes por partícula)
            this.ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, s, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}
