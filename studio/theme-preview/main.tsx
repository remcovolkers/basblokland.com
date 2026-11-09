/**
 * Developer tool: renders real Sanity UI components with the Studio theme, one colour scheme per page,
 * without needing a Sanity login. Run `npm run theme-preview` in studio/ and open the URL, with
 * ?scheme=light|dark and optionally &theme=default to compare against Sanity's own default theme.
 * Not part of the Studio and never deployed. (Layout uses plain styles: @sanity/ui v4 dropped the
 * old padding/space props; only colour, fonts, tones and buttons matter here.)
 */
import '@sanity/ui/styles.css';
import '../layers.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import { Badge, Button, Card, Checkbox, Dialog, Heading, Label, Text, TextInput, ThemeProvider } from '@sanity/ui';
import { Popover } from '@sanity/ui/popover';
import { buildTheme } from '@sanity/ui/theme';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import type { LogoProps } from 'sanity';
import { Logo } from '../components/Logo';
import { theme as studioTheme } from '../theme';

// Same scheme/theme switches as described above. One scheme per page: Sanity UI applies colours via
// page-wide CSS, so two providers on one page would overwrite each other.
const params = new URLSearchParams(location.search);
const scheme = params.get('scheme') === 'dark' ? 'dark' : 'light';
const theme = params.get('theme') === 'default' ? buildTheme() : studioTheme;

const col: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 };
const pad: CSSProperties = { padding: 12 };

function Sample() {
  return (
    <ThemeProvider theme={theme} scheme={scheme}>
      <Card style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 16 }}>
        <div style={{ ...col, gap: 16 }}>
          <div style={{ ...row, justifyContent: 'space-between' }}>
            <Logo {...({ title: 'bas den exter blokland' } as unknown as LogoProps)} />
            <Label muted>{scheme}</Label>
          </div>

          <Card borderBottom style={{ paddingBottom: 12 }}>
            <Heading>kunst</Heading>
          </Card>

          <div style={col}>
            <Card border style={pad}>
              <div style={{ ...col, gap: 2 }}>
                <Text weight="semibold">placeholder werk 01</Text>
                <Text muted>Kunst · 2026</Text>
              </div>
            </Card>
            <Card border tone="primary" style={pad}>
              <div style={{ ...col, gap: 2 }}>
                <Text weight="semibold">placeholder werk 02 (geselecteerd)</Text>
                <Text muted>Kunst · 2025</Text>
              </div>
            </Card>
          </div>

          <div style={col}>
            <Label>Titel</Label>
            <TextInput value="placeholder werk 01" readOnly />
            <Card tone="critical" border style={pad}>
              <Text>Voeg een omslagfoto toe.</Text>
            </Card>
            <Card tone="caution" border style={pad}>
              <Text>Houd het kort: liefst minder dan 600 tekens.</Text>
            </Card>
          </div>

          <div style={row}>
            <Button text="Publiceren" tone="positive" />
            <Button text="Primair" tone="primary" />
            <Button text="Verwijderen" tone="critical" mode="ghost" />
            <Button text="Annuleren" mode="bleed" />
            <Badge tone="positive">gepubliceerd</Badge>
            <Badge tone="caution">concept</Badge>
          </div>

          <div style={row}>
            <Checkbox checked readOnly />
            <Text>Deze regels zijn Inter; labels zijn JetBrains Mono.</Text>
          </div>
        </div>
      </Card>
    </ThemeProvider>
  );
}

// ?dialog=1: a dialog open on top of a form, to judge how a modal separates from the page behind it.
function DialogScene() {
  return (
    <ThemeProvider theme={theme} scheme={scheme}>
      <Card style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 24 }}>
        <div style={{ ...col, gap: 16, maxWidth: 640, margin: '0 auto' }}>
          <Heading>Dikke bling broer</Heading>
          <Label>Beschrijving van de foto (verplicht)</Label>
          <TextInput value="dikke ring broer" readOnly />
          <Label>Bijschrift (optioneel)</Label>
          <TextInput value="" placeholder="Bijvoorbeeld: Detail van de zijkant" readOnly />
          <Label>Extra gegevens</Label>
          <Popover open placement="right" content={<Card padding={3} style={{ width: 220 }}><Label>Naam</Label><TextInput value="Oplage" readOnly /></Card>}>
            <div><Button text="Voeg item toe" mode="ghost" /></div>
          </Popover>
          <Label>Meer foto's</Label>
          <Card border style={pad}>
            <Text>#1 leip!</Text>
          </Card>
          <Card border style={pad}>
            <Text>#2 Zonder titel</Text>
          </Card>
        </div>
      </Card>
      {params.get('dialog') === '1' && (
      <Dialog id="demo" header="Meer foto's / #3 Zonder titel" onClose={() => {}} width={1}>
        <div style={{ ...col, gap: 12, padding: 16 }}>
          <Card border style={pad}>
            <Text>Sleep of plak afbeelding hier</Text>
          </Card>
          <Label>Beschrijving van de foto (verplicht)</Label>
          <TextInput placeholder="Bijvoorbeeld: Zwart metalen beeld op een betonnen sokkel" readOnly />
          <Label>Bijschrift (optioneel)</Label>
          <TextInput placeholder="Bijvoorbeeld: Detail van de zijkant" readOnly />
        </div>
      </Dialog>
      )}
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(params.get('dialog') ? <DialogScene /> : <Sample />);
