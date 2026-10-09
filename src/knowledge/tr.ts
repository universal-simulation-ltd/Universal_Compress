import type { Article } from './types'

const articles: Article[] = [
  {
    id: 'what-is-compression',
    group: 'Temel bilgiler',
    title: 'Sıkıştırma aslında ne yapar',
    summary: 'Bir dosya aynı şeyi nasıl daha az baytla saklayabilir.',
    body: `Cihazınızdaki her dosya, bayt adı verilen uzun bir sayı dizisidir. Sıkıştırma, aynı şeyi daha az baytla anlatma işidir.

## Kalıpları bulmak

Çoğu dosya tekrarlarla doludur. Bir metin sayfası aynı sözcükleri defalarca kullanır. Mavi bir gökyüzü fotoğrafında neredeyse aynı renkte binlerce komşu piksel bulunur. Konuşan birinin kaydında uzun, neredeyse sessiz bölümler vardır.

Bir sıkıştırıcı bu kalıpları bulur ve kısaltarak yazar. "Mavi, mavi, mavi, mavi" ifadesini bin kez saklamak yerine "mavi, bin kez" diye saklayabilir. Ortaya çıkan dosya daha küçüktür ve bu kısaltmayı anlayan bir program, dosyayı açtığınızda resmi, sesi ya da sayfayı yeniden oluşturur.

## Fark etmeyeceğiniz şeyleri dışarıda bırakmak

Resimler, video ve ses, pek fark edilmeyen ayrıntılar da atılarak çok daha fazla küçültülebilir: küçük renk kaymaları, daha yüksek seslerin bastırdığı sesler, hızlı bir sahnedeki ince dokular. Asıl büyük kazançlar buradan gelir ve aşırıya kaçıldığında kalitenin düşebileceği yer de burasıdır.

## Neden önemli

Küçük dosyalar daha hızlı gönderilir, e-posta eki sınırlarına sığar, telefonunuzda daha az yer kaplar ve bir web sayfasında daha hızlı yüklenir. Denge her zaman aynı soruya dayanır: Buna ulaşmak için ne kadarından vazgeçmeye hazırsınız? Universal Compress bu soruyu yalnızca bir kez, **Light** (hafif), **Balanced** (dengeli) veya **Maximum** (en yüksek) seçenekleriyle sorar ve her dosya türü için ayrıntıları kendisi ayarlar.`,
  },
  {
    id: 'lossless-and-lossy',
    group: 'Temel bilgiler',
    title: 'Kayıpsız ve kayıplı sıkıştırma',
    summary: 'Bir dosyayı yeniden paketlemek ile yeniden kodlamak arasındaki fark.',
    body: `İki tür sıkıştırma vardır ve hangisinin kullanıldığını bilmek sonuçtan ne bekleyeceğinizi söyler.

## Kayıpsız

Kayıpsız sıkıştırma, orijinalin her baytını korur. Dosya açıldığında son ayrıntısına kadar tam olarak eski hâline getirilir. ZIP arşivleri böyle çalışır, PNG resim biçimi de öyle.

Sorun şu ki kazanç sınırlıdır. Yalnızca tekrarlar çıkarılabilir ve bunlar bir kez çıkarıldığında atılacak başka bir şey kalmaz.

## Kayıplı

Kayıplı sıkıştırma, orijinale çok yakın görünen ya da duyulan ama aynısı olmayan bir şey oluşturur. JPEG fotoğraflar, MP3 ve AAC ses ve neredeyse tüm videolar böyle çalışır. Ayrıntılar kalıcı olarak atıldığı için bu biçimler dosyaları kat kat küçültebilir.

Bundan iki sonuç çıkar:

- **Kayıp kalıcıdır.** Bir kopyayı sıkıştırmakta sakınca yoktur; ileride tam kaliteye ihtiyaç duyabilirseniz orijinali saklayın.
- **Tekrarlamak birikir.** Her kayıplı sıkıştırma biraz daha fazlasını atar; bu yüzden zaten sıkıştırılmış bir dosyayı yeniden sıkıştırmak genellikle küçük bir kazanç için kaliteden götürür.

## Universal Compress'te

- **Light** seçeneğinde bir PDF kayıpsız olarak yeniden paketlenir. Metin seçilebilir ve aranabilir kalır; kazanç genellikle mütevazıdır.
- **Balanced** veya **Maximum** seçeneğinde PDF'nin her sayfası bir resme dönüştürülür. Kazanç özellikle taranmış belgelerde çoğu zaman büyüktür, ancak metin artık seçilemez ve aranamaz.
- Resimler, video ve ses kayıplı biçimlerde yeniden kodlanır. Seçtiğiniz düzey, boyut karşılığında ne kadar ayrıntıdan vazgeçileceğini belirler; Fine-tune altındaki seçeneklerle tam değerleri kendiniz ayarlayabilirsiniz.`,
  },
  {
    id: 'why-some-files-barely-shrink',
    group: 'Temel bilgiler',
    title: 'Bazı dosyalar neden neredeyse hiç küçülmez',
    summary: 'Zaten sıkıştırılmış dosyalar ve ZIP dosyalarının neden reddedildiği.',
    body: `Bazen bir dosyayı sıkıştırırsınız ve neredeyse aynı boyutta, hatta daha büyük çıkar. Bu bir arıza değildir; genellikle dosyanın zaten sıkıştırılmış olduğu anlamına gelir.

## Sıkıştırma yalnızca bir kez işe yarar

Sıkıştırma tekrarları ortadan kaldırır. Bu iş iyi yapıldığında sonuç neredeyse rastgele görünür ve rastgele verilerde çıkarılacak kalıp kalmaz. İkinci bir sıkıştırıcı yapacak bir şey bulamaz, kendi kayıt bilgileri de dosyayı biraz büyütebilir.

Genellikle zaten sıkıştırılmış olanlar:

- ZIP, RAR, 7z ve .gz gibi **arşivler**.
- Word, Excel ve PowerPoint'in modern biçimlerindeki **Office belgeleri**; bunların içi aslında ZIP arşividir.
- Doğrudan telefondan gelen **fotoğraf ve videolar**; bunlar zaten kayıplı biçimlerde kaydedilir.
- Onları oluşturan program tarafından özenle hazırlanmış **PDF'ler**.

## Universal Compress bu konuda ne yapar

- ZIP, RAR, 7z veya .gz arşivlerini ya da Word, Excel ve PowerPoint dosyalarını sıkıştırmaya çalışmaz. Bunları nedenini açıklayan bir cümleyle listede tutar. Bir sunum ya da belge için önce PDF olarak dışa aktarıp o PDF'yi sıkıştırmak çoğu zaman daha iyi bir yoldur.
- Sıkıştırma bir dosyayı aynı boyutta ya da daha büyük hâle getirecekse, uygulama size daha kötü bir sonuç vermek yerine **orijinal dosyanızı** geri verir ve bunu dosyanın satırında belirtir.
- Başlamadan önce her düzey, üreteceği boyutun bir tahminini gösterir; böylece daha güçlü bir ayarın buna değip değmeyeceğini önceden görebilirsiniz.

## Daha fazla kazanç elde etmek

Bir fotoğraf ya da video Light ile neredeyse hiç küçülmüyorsa Balanced veya Maximum'u deneyin. Bu düzeyler resmin piksel boyutlarını da küçültür ve asıl kazanç genellikle buradadır. Taranmış sayfalardan oluşan bir PDF için Balanced çoğu zaman büyük fark yaratır.`,
  },
  {
    id: 'how-universal-compress-works',
    group: 'Nasıl çalışır',
    title: 'Universal Compress nasıl çalışır',
    summary: 'Her dosya türüne göre uyarlanan tek bir güç ayarı.',
    body: `İstediğiniz dosyaları karışık olarak bırakın; uygulama onları türüne göre ayırır: PDF'ler, videolar, resimler ve ses. Her türün kendi seçenek paneli vardır, ancak hepsi tek bir denetimi paylaşır.

## Light, Balanced, Maximum

Güç denetimi her dosya için aynı soruyu sorar: Ne kadar sıkıştırılsın? Ardından her dosya türü cevabınızı kendi ayarlarına dönüştürür:

- **PDF.** Light dosyayı kayıpsız olarak yeniden paketler. Balanced sayfaları baskı çözünürlüğünde resimlere dönüştürür. Maximum aynısını ekran çözünürlüğünde yapar.
- **Video.** Light özgün kare boyutunu korur. Balanced görüntüyü 1080p ile sınırlar ve bit hızını düşürür. Maximum görüntüyü 720p ile ve en düşük bit hızıyla sınırlar.
- **Resimler.** Light yüksek kalitede ve tam boyutta yeniden kodlar. Balanced en uzun kenarı 2560 pikselle sınırlar. Maximum daha düşük kaliteyle 1600 pikselle sınırlar.
- **Ses.** Light 192 kbps, Balanced 128 kbps, Maximum ise mono olarak 96 kbps'dir.

Video, resim ve seste bir düzeyin seçtiği her şey **Fine-tune** altında gösterilir ve oradan istediğiniz değeri değiştirebilirsiniz.

## Bilmekte yarar var

- **Çıktı biçimleri.** Video MP4 olarak çıkar. Ses MP3 veya M4A olarak çıkar. JPEG ve WebP fotoğraflar varsayılan olarak biçimlerini korur; tarayıcı yazabiliyorsa AVIF de korunur. PNG, BMP, hareketsiz GIF ve iPhone HEIC resimleri varsayılan olarak WebP'ye dönüştürülür, çünkü bu genellikle çok daha küçüktür. Bunun yerine JPEG veya WebP seçebilirsiniz.
- **Hareketli GIF'ler hareketli kalır.** Bunlar ayrı bir işlemden geçer ve Maximum'da her iki kareden biri atılırken animasyonun süresi korunur.
- **Video için uygun bir tarayıcı gerekir.** Video sıkıştırma, tarayıcının yerleşik video kodlayıcısını kullanır; bu kodlayıcı Chrome, Edge ve Safari 16.4 ve sonrasında bulunur. PDF'ler, resimler ve ses güncel her tarayıcıda çalışır.
- **Bazı video kapsayıcıları desteklenmez.** MP4, M4V ve MOV çalışır. MKV, WebM, AVI, WMV ve FLV dosyalarının önce MP4'e dönüştürülmesi gerekir.
- **Elinizde dosya yok mu?** İlk ekrandaki **Try with an example photo**, uygulamayla birlikte gelen örnek bir fotoğrafı yükler; böylece kendi dosyalarınızı kullanmadan önce ne yaptığını görebilirsiniz. Diğer her şey gibi bu da cihazınızdan hiç çıkmaz.
- **Kaydetme.** Dosyaları tek tek ya da hepsini birden bir ZIP olarak indirin. Bu ZIP yalnızca sonuçları bir araya getirir; onları daha fazla sıkıştırmaz.
- **İstediğiniz kadar yeniden deneyin.** Düzeyi değiştirip tüm listeyi yeniden sıkıştırarak boyutları karşılaştırabilirsiniz.`,
  },
  {
    id: 'your-files-stay-on-your-device',
    group: 'Gizlilik ve güvenlik',
    title: 'Dosyalarınız cihazınızda kalır',
    summary: 'Bir sunucuya ne gönderilir ve ne asla gönderilmez.',
    body: `Universal Compress tüm işini kendi cihazınızda yapar. Dosyalarınız sıkıştırılmak için hiçbir yere yüklenmez.

## İş nerede yapılır

Bir dosyayı bıraktığınızda, dosya cihazınızda çalışan uygulama tarafından okunur. PDF'ler uygulamanın içinde çalışan açık kaynaklı PDF kitaplıklarıyla işlenir. Resimler tarayıcınızın kendi resim araçlarıyla yeniden kodlanır. Video, tarayıcınızın yerleşik video kodlayıcısını kullanır. Ses, tarayıcınız tarafından çözülür ve uygulamanın içinde çalışan bir MP3 veya AAC kodlayıcısıyla kodlanır. Sonuçlar doğrudan cihazınıza kaydedilir ya da telefonda paylaşım menüsüne aktarılır.

Dosyalarınız yalnızca uygulama açıkken bellekte tutulur. Uygulama onları saklamaz ve uygulamayı kapattığınızda silinir.

Hiçbir şey yüklenmediği için boyut sınırı ya da günlük kota yoktur. Tek sınır cihazınızın belleğidir.

## Uygulamanın gönderdikleri

Uygulama, dosyalarınızla hiçbir ilgisi olmayan birkaç küçük istek yapar:

- **Oturum açma**, eğer siz isterseniz. Uygulamadaki hiçbir şey hesap gerektirmez.
- Oturum açtığınızda, Universal ID etkinliğinizin doğru olması için **"uygulama açıldı" bildirimi**. Dosyalarınız hakkında hiçbir şey içermez.
- Uygulama açık ve ekrandayken her 45 saniyede bir **"uygulama kullanımda" sinyali**. Uygulamanın adını, cihazınızda oluşturulan rastgele bir kimliği ve oturum açtıysanız hesabınızı içerir. Uygulamayı kaç kişinin kullandığını göstermek için kullanılır.
- **Güncellemelerin denetlenmesi** ve yenilikler listesinin alınması.

Reklam ya da üçüncü taraf izleme yoktur.

## Kendiniz doğrulayın

En basit test, internet bağlantınızı kapatıp bir şey sıkıştırmaktır. Yine çalışır, çünkü hiçbir şeyin cihazınızdan çıkması gerekmez. Uygulama ayrıca açık kaynaklıdır; herkes tam olarak ne yaptığını okuyabilir.`,
  },
]

export default articles
