# Tactical RMM dashboard – community fork (`trmm-custom`)

This is an **unofficial fork** of [**tacticalrmm-web**](https://github.com/amidaware/tacticalrmm-web),
the Vue dashboard of [Tactical RMM](https://github.com/amidaware/tacticalrmm)
by AmidaWare LLC. It is not affiliated with, endorsed or supported by AmidaWare.

The `trmm-custom` branch is the **official dashboard v0.101.65** (the one
shipped with Tactical RMM v1.6.1) plus the features below. It needs the
backend from
[andrewsbejatto/tacticalrmm, branch `trmm-custom`](https://github.com/andrewsbejatto/tacticalrmm/tree/trmm-custom),
which also describes every feature in detail.

## What is new

- **Translations with vue-i18n.**
  - Every string of the dashboard is in `src/i18n/locales/<locale>/*.json`.
  - English and **Brazilian Portuguese** are complete.
  - The language is chosen per user (Preferences and the login page).
  - Adding a language means adding a folder with the same keys.
- **Quick Support:**
  - connect by 9-digit code (remote desktop, terminal, files) and see the
    session list;
  - approve or deny "install permanent access", choosing client, site and
    type;
  - download the customer executable;
  - settings tab in Global Settings;
  - "Use Quick Support" role permission.
- **Session recordings:**
  - list with filters (client, site, agent, technician, source, period);
  - player: `.webm` in a video tag, MeshCentral `.mcrec` in the MeshCentral
    player ported to `public/mcrec-player` (Apache-2.0, license kept);
  - "Session Recordings" tab in Global Settings (S3 storage, sources to
    record, storage test);
  - "View session recordings" role permission. Without it the menu and
    the button are hidden.
- **Remote access (TRMM Desktop):** "Use Remote Access" role permission.
- **Remote Background** button in the agent quick bar.
- The native file browser of v0.101.65 is translated too.

## Build

Same as upstream:

```bash
npm install
npm run build        # output in dist/
```

The backend setting `CUSTOM_WEBTAR_URL` (https) lets the official `update.sh`
install your own build instead of the official dashboard. Keep the server's
`dist/env-config.js` when you replace the files by hand.

When you add strings, put them in the JSON files of **both** locales with the
same keys. Never use `%{` in a message: the vue-i18n compiler hangs.

## License

Licensed under the **Tactical RMM License Version 1.0**, like the original (see
[LICENSE.md](LICENSE.md)). It is not an open-source license and restricts
commercial / for-profit services built on the software.

    Copyright © 2022 AmidaWare LLC.
    Licensed under the Tactical RMM License Version 1.0 (the “License”).
    You may only use the Licensed Software in accordance with the License.
    A copy of the License is available at: https://license.tacticalrmm.com

"Tactical RMM" is a trade mark of AmidaWare LLC. The MeshCentral player in
`public/mcrec-player` is from [MeshCentral](https://github.com/Ylianst/MeshCentral),
Apache License 2.0.

---

### Português (resumo)

Fork não oficial do painel do [Tactical RMM](https://github.com/amidaware/tacticalrmm-web)
v0.101.65. Traz:
- tradução completa para português do Brasil, com vue-i18n e idioma por
  usuário;
- telas do Suporte Rápido;
- telas das gravações de sessões, com o player;
- permissões novas.

Precisa do backend do branch `trmm-custom` do fork `andrewsbejatto/tacticalrmm`.
Não tem relação com a AmidaWare.
