import * as THREE from 'three';

/**
 * Earth: daytime imagery blended into city lights on the night side, with sun
 * glint on the oceans and a soft atmospheric rim. The sun is at the origin.
 */
export function createEarthMaterial({ day, night, water }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: day },
      nightMap: { value: night },
      waterMap: { value: water },
      sunPosition: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform sampler2D waterMap;
      uniform vec3 sunPosition;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 N = normalize(vNormalW);
        vec3 L = normalize(sunPosition - vPosW);
        vec3 V = normalize(cameraPosition - vPosW);
        float ndl = dot(N, L);
        vec3 day = texture2D(dayMap, vUv).rgb;
        vec3 night = texture2D(nightMap, vUv).rgb;
        float water = texture2D(waterMap, vUv).r;

        float dayMix = smoothstep(-0.12, 0.18, ndl);
        vec3 lit = day * (max(ndl, 0.0) * 1.15 + 0.04);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 60.0) * water * 0.7 * smoothstep(0.0, 0.1, ndl);
        lit += vec3(1.0, 0.95, 0.85) * spec;
        vec3 dark = night * vec3(1.0, 0.85, 0.6) * 1.6 + day * 0.012;
        vec3 col = mix(dark, lit, dayMix);

        // Atmosphere rim (blue on the day side, faint at night).
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += vec3(0.30, 0.55, 1.0) * fres * (0.15 + 0.85 * smoothstep(-0.2, 0.4, ndl)) * 0.8;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Backside shell that glows around the limb of a planet with an atmosphere. */
export function createAtmosphereMaterial(color = new THREE.Color(0.35, 0.6, 1.0), strength = 1.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: color },
      sunPosition: { value: new THREE.Vector3() },
      strength: { value: strength },
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 glowColor;
      uniform vec3 sunPosition;
      uniform float strength;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 L = normalize(sunPosition - vPosW);
        // Back faces: x runs from 0 at the shell's outer edge to 1 at its centre;
        // the planet's limb sits at x ≈ 0.33 for a shell 6% larger than the planet.
        float x = clamp(-dot(N, V), 0.0, 1.0);
        float rim = smoothstep(0.0, 0.33, x) * (1.0 - 0.75 * smoothstep(0.33, 0.8, x));
        float sunSide = smoothstep(-0.35, 0.35, dot(N, L));
        float a = rim * rim * (0.08 + 0.92 * sunSide) * strength;
        gl_FragColor = vec4(glowColor * a, a);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}
