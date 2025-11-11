// src/utils/PerlinNoise.ts

// A simple Perlin Noise implementation
// Based on https://mrl.nyu.edu/~perlin/noise/
// and https://gist.github.com/banksean/3045220

export class PerlinNoise {
    private p: number[] = [];

    constructor(seed?: number) {
        this.p = new Array(512);
        const permutation = new Array(256);
        for (let i = 0; i < 256; i++) {
            permutation[i] = i;
        }

        if (seed) {
            // Simple pseudo-random shuffle for seeding
            const random = this.createSeededRandom(seed);
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
            }
        } else {
            // Default random shuffle
            for (let i = 255; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
            }
        }

        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = permutation[i];
        }
    }

    private createSeededRandom(seed: number) {
        let s = seed;
        return function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number, z: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    public noise(x: number, y: number, z: number): number {
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        let Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A = this.p[X] + Y;
        const AA = this.p[A] + Z;
        const AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y;
        const BA = this.p[B] + Z;
        const BB = this.p[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
                                                this.grad(this.p[BA], x - 1, y, z)),
                                    this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                                                this.grad(this.p[BB], x - 1, y - 1, z))),
                            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                                                this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                                    this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                                                this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }

    // 2D noise for terrain generation
    public noise2D(x: number, y: number): number {
        return this.noise(x, y, 0); // Use 0 for the z-coordinate for 2D noise
    }
}
