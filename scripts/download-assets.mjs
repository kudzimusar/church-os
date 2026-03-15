import fs from 'fs';
import path from 'path';
import https from 'https';

const images = [
  // Staff photos
  { url: 'https://static.wixstatic.com/media/91bb3f_9bd80a2298b947f3b4924dea40b5e360~mv2.jpg/v1/crop/x_87,y_93,w_818,h_1037/fill/w_268,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Pastor%20Marcel%20Jonte%20Gadsden.jpg', dest: 'public/images/staff/pastor-marcel.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_211d49c8695c43ffb3ca3e9606e9b7aa~mv2.jpg/v1/crop/x_132,y_56,w_598,h_721/fill/w_268,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Elder%20Sanna%20Patterson.jpg', dest: 'public/images/staff/sanna-patterson.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_e4c2ec6f92d84667a3a3c20b1650a439~mv2.jpg/v1/crop/x_156,y_113,w_686,h_826/fill/w_268,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Yutaka%20Nakamura.jpg', dest: 'public/images/staff/yutaka-nakamura.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_a2d3659d55514c6d852d26165dba070f~mv2.jpg/v1/crop/x_39,y_83,w_718,h_888/fill/w_261,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Eri%20Kudo.jpg', dest: 'public/images/staff/eri-kudo.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_eeedba78bb3448b2925af34af0a389fb~mv2.jpg/v1/crop/x_71,y_87,w_712,h_881/fill/w_261,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Eiko%20Tanaka.jpg', dest: 'public/images/staff/eiko-kuboyama.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_ef50c5c40c7d402d8236b2e3288fcb22~mv2.jpg/v1/crop/x_84,y_59,w_717,h_907/fill/w_261,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Yurie%20Suzuki.jpg', dest: 'public/images/staff/yurie-suzuki.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_b85486d9b4cc4941a5647d77f76d2ede~mv2.jpg/v1/crop/x_65,y_32,w_708,h_898/fill/w_261,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Naomi%20Yamamoto.jpg', dest: 'public/images/staff/naomi-yamamoto.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_48328887afd949fd9ab7944927cec437~mv2.jpg/v1/crop/x_88,y_62,w_663,h_840/fill/w_261,h_323,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Itsuki%20Kuboyama.jpg', dest: 'public/images/staff/itsuki-kuboyama.jpg' },

  // Pastor photos
  { url: 'https://static.wixstatic.com/media/b25f99_861d8922a2d4492a989fa0be16bb42f4~mv2.png/v1/fill/w_490,h_367,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_861d8922a2d4492a989fa0be16bb42f4~mv2.png', dest: 'public/images/pastor/pastor-and-chiaki.png' },
  { url: 'https://static.wixstatic.com/media/91bb3f_6cd000b758af4c20a75b7c8c8ac57c3f~mv2.png/v1/fill/w_1139,h_759,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/_MG_1029_edited_edited.png', dest: 'public/images/pastor/pastor-profile.png' },
  { url: 'https://static.wixstatic.com/media/91bb3f_ecad50403c06401c8543d506b1a78bea~mv2.jpg/v1/fill/w_980,h_653,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/91bb3f_ecad50403c06401c8543d506b1a78bea~mv2.jpg', dest: 'public/images/pastor/pastor-event.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_bc0cae65707f46399d58525c07defccd~mv2.jpg/v1/fill/w_980,h_614,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/91bb3f_bc0cae65707f46399d58525c07defccd~mv2.jpg', dest: 'public/images/pastor/pastor-speaking.jpg' },

  // Book covers
  { url: 'https://static.wixstatic.com/media/b25f99_a71cf2f304484676b49d757fc906c9eb~mv2.png/v1/fill/w_189,h_304,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/pop_edited_edited.png', dest: 'public/images/books/book-power-of-purpose.png' },
  { url: 'https://static.wixstatic.com/media/b25f99_eb04afd1e3064e618cc4a0cb6c5810c2~mv2.webp/v1/fill/w_210,h_288,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/AME-Cover-3D.webp', dest: 'public/images/books/book-miraculous-encounter.webp' },
  { url: 'https://static.wixstatic.com/media/91bb3f_8e16dad6c49c4e48b61ec724f22136e2~mv2.png/v1/fill/w_198,h_288,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/WIB-English-fb-profile.png', dest: 'public/images/books/book-why-i-am-black.png' },
  { url: 'https://static.wixstatic.com/media/91bb3f_348ba32ea9144b588f2da1b33cecbf9e~mv2.jpg/v1/crop/x_370,y_9,w_1631,h_2054/fill/w_198,h_250,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/LC-Eng-Japanese-01.jpg', dest: 'public/images/books/book-love-challenge.jpg' },

  // Church building
  { url: 'https://static.wixstatic.com/media/b25f99_d323598d054c49e8828febd2f8d2c3c6~mv2.webp/v1/fill/w_483,h_370,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/church%20image.webp', dest: 'public/images/church/building-exterior.webp' },
  { url: 'https://static.wixstatic.com/media/91bb3f_626837cb395d4e4f8e88b2859fa02154~mv2.png/v1/crop/x_42,y_0,w_3949,h_3024/fill/w_482,h_369,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_7711_HEIC.png', dest: 'public/images/church/building-banner.png' },
  { url: 'https://static.wixstatic.com/media/b25f99_912315834cd44ca7b1c21c4868638bcd~mv2.webp/v1/fill/w_577,h_473,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_912315834cd44ca7b1c21c4868638bcd~mv2.webp', dest: 'public/images/church/parking-1.webp' },
  { url: 'https://static.wixstatic.com/media/b25f99_47a50bff4d40469bb1be84268625181d~mv2.webp/v1/fill/w_577,h_473,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_47a50bff4d40469bb1be84268625181d~mv2.webp', dest: 'public/images/church/parking-2.webp' },

  // History photos
  { url: 'https://static.wixstatic.com/media/b25f99_d28f7841e69a4104820bbfe2b9ed066d~mv2.png/v1/fill/w_980,h_548,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_d28f7841e69a4104820bbfe2b9ed066d~mv2.png', dest: 'public/images/history/beginning-1.png' },
  { url: 'https://static.wixstatic.com/media/b25f99_e1d02ae12d524384af28b963051ef8c4~mv2.png/v1/fill/w_980,h_513,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_e1d02ae12d524384af28b963051ef8c4~mv2.png', dest: 'public/images/history/beginning-2.png' },
  { url: 'https://static.wixstatic.com/media/b25f99_77b3dade8d47495aa4592725bce19985~mv2.png/v1/fill/w_980,h_542,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/b25f99_77b3dade8d47495aa4592725bce19985~mv2.png', dest: 'public/images/history/beginning-3.png' },
  { url: 'https://static.wixstatic.com/media/91bb3f_df3fd676f01849e4888b49ae7460fda1~mv2.jpg/v1/fill/w_303,h_227,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_7673_JPG.jpg', dest: 'public/images/history/service-1.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_2a1d0bf2623144fa833187036e75ae02~mv2.jpg/v1/fill/w_303,h_227,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_7672_JPG.jpg', dest: 'public/images/history/service-2.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_3475babeee2b4670856fcb27fde6f606~mv2.jpg/v1/crop/x_0,y_158,w_1202,h_734/fill/w_600,h_366,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_7682.jpg', dest: 'public/images/history/service-3.jpg' },
  { url: 'https://static.wixstatic.com/media/91bb3f_5b42026ffa8e43b28bc603980076ab5d~mv2.jpg/v1/crop/x_136,y_0,w_868,h_633/fill/w_303,h_227,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_7678.jpg', dest: 'public/images/history/outreach.jpg' },
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const img of images) {
    try {
      await download(img.url, img.dest);
      console.log('✓', img.dest);
    } catch (e) {
      console.error('✗', img.dest, e.message);
    }
  }
  console.log('Done.');
}

run();
