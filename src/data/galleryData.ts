export interface GalleryImage {
  src: string;
  altKey: string;
  captionKey?: string;
  captionText?: string;
}

export interface GallerySection {
  titleKey: string;
  mainImage?: GalleryImage;
  images: GalleryImage[];
}

export const galleryData: GallerySection[] = [
  {
    titleKey: 'propriety.gallery.section1.title',
    mainImage: {
  src: '/ingressoNotte/ingresso2.webp',
      altKey: 'propriety.gallery.section1.ingressoNotte.alt',
      
    },
    images: [
      {
  src: '/ingressoNotte/ingresso_nw.webp',
        altKey: 'propriety.gallery.section1.image1.alt',
        
      },
      {
  src: '/ingressoNotte/ingresso1.webp',
        altKey: 'propriety.gallery.section1.image2.alt'
      },

      {
  src: '/ingressoNotte/ingresso2a.webp',
        altKey: 'propriety.gallery.section1.image3.alt'
      },

      {
  src: '/ingressoNotte/ingresso3.webp',
        altKey: 'propriety.gallery.section1.image5.alt'
      },
      {
  src: '/corridoio/corridoio.webp',
        altKey: 'propriety.gallery.section1.image6.alt'
      },
      {
  src: '/corridoio/corridoio2.webp',
        altKey: 'propriety.gallery.section1.image7.alt'
      },
      {
  src: '/corridoio/corridoio3.webp',
        altKey: 'propriety.gallery.section1.image8.alt'
      }
    
    ]
  },
  {
    titleKey: 'propriety.gallery.section2.title',
    mainImage: {
  src: '/cameraBlu/camera letto 1.1.webp',
      altKey: 'propriety.gallery.section2.mainImage.alt',
      
    },
    
    images: [
      
  { src: '/cameraBlu/camera letto 1.2.webp',
        altKey: 'propriety.gallery.section2.img6.alt'
      },
  { src: '/cameraBlu/camera letto 1.3.webp',
        altKey: 'propriety.gallery.section2.img7.alt'
      },
  { src: '/cameraBlu/camera letto 1.4.webp',
        altKey: 'propriety.gallery.section2.img8.alt'
      },
  { src: '/cameraBlu/camera letto 2.0.webp',
        altKey: 'propriety.gallery.section2.img9.alt'
      },
  { src: '/cameraBlu/camera letto 2.1.webp',
        altKey: 'propriety.gallery.section2.img10.alt'
      },
  { src: '/cameraBlu/camera letto 2.2.webp',
        altKey: 'propriety.gallery.section2.img11.alt'
      },
  { src: '/cameraBlu/camera letto 2.3.webp',
        altKey: 'propriety.gallery.section2.img12.alt'
      }
    ]
  },

  {titleKey: 'propriety.gallery.section3.title',
    mainImage: {
  src: '/cameraSingola/singolaheader.webp',
      altKey: 'propriety.gallery.section3.mainImage.alt',
      
    },
    images: [
      {
  src: '/cameraSingola/1_giorno.webp',
        altKey: 'propriety.gallery.section3.img1.alt',
        
      },
      {
  src: '/cameraSingola/1_notte.webp',
        altKey: 'propriety.gallery.section3.img2.alt',
      },
      {
  src: '/cameraSingola/2_giorno.webp',
        altKey: 'propriety.gallery.section3.img3.alt',
      },
      {
  src: '/cameraSingola/2_notte.webp',
        altKey: 'propriety.gallery.section3.img4.alt',
      },
      {
  src: '/cameraSingola/singola 1.webp',
        altKey: 'propriety.gallery.section3.img5.alt',
        captionKey: 'propriety.gallery.section3.img5.caption',
      },
      {
  src: '/cameraSingola/singola 2.webp',
        altKey: 'propriety.gallery.section3.img6.alt',
        captionKey: 'propriety.gallery.section3.img6.caption',
      }    
    
    ]
  },
  {titleKey: 'propriety.gallery.section4.title',
    mainImage: {
  src: '/openSpace/open_new.webp',
      altKey: 'propriety.gallery.section4.mainImage.alt',
     },
    images: [
      {
  src: '/openSpace/open1.webp',
        altKey: 'propriety.gallery.section4.img1.alt',
        
      },
      {
  src: '/openSpace/open2.webp',
        altKey: 'propriety.gallery.section4.img2.alt',
      },
      {
  src: '/openSpace/open3.webp',
        altKey: 'propriety.gallery.section4.img3.alt',
      },
      {
  src: '/openSpace/open4a.webp',
        altKey: 'propriety.gallery.section4.img4.alt',
      },
      {
  src: '/openSpace/open4.webp',
        altKey: 'propriety.gallery.section4.img5.alt',
      }
    
    ]
  },

  {titleKey: 'propriety.gallery.section5.title',
    mainImage: {
  src: '/bagno1/bagno1.webp',
    altKey: 'propriety.gallery.section5.mainImage.alt',
  },
    images: [
      {
  src: '/bagno1/bagno1.webp',
        altKey: 'propriety.gallery.section5.img1.alt',  
      },
      {
  src: '/bagno1/bagno2.webp',
        altKey: 'propriety.gallery.section5.img2.alt',
      },
      {
  src: '/bagno1/bagno3.webp',
        altKey: 'propriety.gallery.section5.img3.alt',
      },
      {
  src: '/bagno2/bagno4a.webp',
        altKey: 'propriety.gallery.section5.img4.alt',
      },
      {
  src:'/bagno2/bagno4.webp',
        altKey: 'propriety.gallery.section5.img5.alt',
      },
      {
  src: '/bagno2/bagno5.webp',
        altKey: 'propriety.gallery.section5.img6.alt',
      },
      {
  src: '/bagno2/bagno6.webp',
        altKey: 'propriety.gallery.section5.img7.alt',
      },
      {
  src: '/bagno2/bagno7.webp',
        altKey: 'propriety.gallery.section5.img8.alt',
      },
      {
  src: '/bagno2/bagno7.webp',
        altKey: 'propriety.gallery.section5.img9.alt',
      },
      {
  src: '/bagno2/bagno8.webp',
        altKey: 'propriety.gallery.section5.img10.alt',
      },
      {
  src: '/bagno2/bagno9.webp',
        altKey: 'propriety.gallery.section5.img11.alt',
      }
    ]
  },

  {titleKey: 'propriety.gallery.section6.title',
    mainImage: {
  src: '/esterni/ingressoindex.webp',
      altKey: 'propriety.gallery.section6.mainImage.alt',
    },
    images: [
      {
  src: '/esterni/esterno1.webp',
        altKey: 'propriety.gallery.section6.img1.alt',
      },
      {
  src: '/esterni/esterno2.webp',
        altKey: 'propriety.gallery.section6.img2.alt',
      },
      {
  src: '/esterni/esterno3.webp',
        altKey: 'propriety.gallery.section6.img3.alt',
      },
      {
  src: '/esterni/esterno4.webp',
        altKey: 'propriety.gallery.section6.img4.alt',
      },
      {
  src: '/esterni/esterno5.webp',
        altKey: 'propriety.gallery.section6.img5.alt',
      },

    {
      src: '/esterni/esterno6.webp',
      altKey: 'propriety.gallery.section6.img6.alt',
    },
    {
      src: '/esterni/esterno7.webp',
      altKey: 'propriety.gallery.section6.img7.alt',
    },
    {
      src: '/esterni/esterno8.webp',
      altKey: 'propriety.gallery.section6.img8.alt',
    },
    {
      src: '/esterni/esterno9.webp',
      altKey: 'propriety.gallery.section6.img9.alt',
    },
    {
      src: '/esterni/esterno10.webp',
      altKey: 'propriety.gallery.section6.img10.alt',
    }
    ]
  }

]