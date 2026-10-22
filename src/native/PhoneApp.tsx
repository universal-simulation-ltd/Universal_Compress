import ProductLogo from '../components/Header/ProductLogo'
import { loadArticles } from '../knowledge'
import { ABOUT } from '../lib/aboutApp'
import { useCompressStore } from '../stores/compressStore'
import { useThemeStore } from '../stores/themeStore'
import { usePhoneNav } from './nav'
import { Row } from './parts'
import { PhoneBar, PhoneLayers, type PhoneAppInfo } from './screens'
import { useNT } from './strings'

// Universal Compress's phone chrome (iOS and Android). The website's navbar
// opened four popups here: the Actions dropdown (Clear the list), Tune this
// app, About and the knowledge base, each a dropdown or a centred dialog. On
// the phone the bar is the light bar, the mark and ⋯; ⋯ is a bottom sheet with
// Clear the list, and Tune this app, the guides and About are pages.

const APP: PhoneAppInfo = {
  name: 'Universal Compress',
  logo: <ProductLogo />,
  about: ABOUT,
  themeStore: useThemeStore,
  loadArticles,
}

export function CompressPhoneBar() {
  return <PhoneBar app={APP} />
}

export function CompressPhoneLayers() {
  const t = useNT()
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const clearQueue = useCompressStore((s) => s.clearQueue)
  const resetSettings = useCompressStore((s) => s.resetSettings)
  return (
    <PhoneLayers
      app={APP}
      actions={
        <Row
          icon="🧹"
          label={t('app.clear_list')}
          chevron={false}
          disabled={running || items.length === 0}
          onClick={() => {
            usePhoneNav.getState().closeMore()
            clearQueue()
          }}
        />
      }
      // Withheld while a batch runs, as on the website.
      onReset={running ? undefined : resetSettings}
    />
  )
}
