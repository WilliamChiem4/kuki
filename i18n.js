/* ============================================================
   KUKI — i18n (shared on every page, load FIRST)
   A tiny, build-free translation layer for English ⇄ Vietnamese.

   • Static copy is marked up in the HTML with:
       data-i18n="key"           → sets textContent
       data-i18n-html="key"      → sets innerHTML (keeps inline markup)
       data-i18n-attr="attr:key" → sets one or more attributes
                                    (semicolon-separated, e.g.
                                     "placeholder:foo;aria-label:bar")
   • Dynamic copy (cart drawer, checkout, add-to-cart, sign-in) calls
     KukiI18n.t('key', {vars}) and re-renders on KukiI18n.onChange().
   • The chosen language persists in localStorage ('kuki.lang') and is
     re-applied on every page, so the toggle works site-wide.

   Exposes window.KukiI18n. No dependencies; safe to load before cart.js.
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'kuki.lang';
  const SUPPORTED = ['en', 'vi'];
  const DEFAULT = 'en';

  /* ---- Dictionary --------------------------------------------
     One entry per string: { en, vi }. Keys are grouped by area.
     {placeholders} are filled in by t(key, vars). */
  const DICT = {
    /* --- Document titles --- */
    'title.index':    { en: 'KUKI — Fresh-baked cookies delivered warm', vi: 'KUKI — Bánh nướng tươi giao đến khi còn ấm' },
    'title.order':    { en: 'Order — KUKI', vi: 'Đặt Hàng — KUKI' },
    'title.checkout': { en: 'Checkout — KUKI', vi: 'Thanh Toán — KUKI' },
    'title.signin':   { en: 'Sign In — KUKI', vi: 'Đăng Nhập — KUKI' },

    /* --- Generic / a11y --- */
    'a11y.skip':       { en: 'Skip to content', vi: 'Bỏ qua đến nội dung' },
    'a11y.homeBrand':  { en: 'KUKI — home', vi: 'KUKI — trang chủ' },
    'a11y.instagram':  { en: 'KUKI on Instagram', vi: 'KUKI trên Instagram' },
    'a11y.tiktok':     { en: 'KUKI on TikTok', vi: 'KUKI trên TikTok' },
    'a11y.openMenu':   { en: 'Open menu', vi: 'Mở menu' },
    'a11y.closeMenu':  { en: 'Close menu', vi: 'Đóng menu' },
    'a11y.fiveStars':  { en: '5 out of 5 stars', vi: '5 trên 5 sao' },

    /* --- Nav --- */
    'nav.signin':  { en: 'Sign In', vi: 'Đăng Nhập' },
    'nav.order':   { en: 'Order Now', vi: 'Đặt Hàng' },
    'nav.home':      { en: 'Home', vi: 'Trang Chủ' },
    'nav.orderItem': { en: 'Order', vi: 'Đặt Hàng' },
    'nav.catering':  { en: 'Catering', vi: 'Đặt Tiệc' },
    'nav.giftcards': { en: 'Gift Cards', vi: 'Thẻ Quà Tặng' },
    'nav.soon':      { en: 'Coming soon', vi: 'Sắp ra mắt' },
    'nav.why':     { en: 'Why KUKI', vi: 'Vì Sao KUKI' },
    'nav.cookie':  { en: 'The Cookie', vi: 'Chiếc Bánh' },
    'nav.how':     { en: 'How It Works', vi: 'Cách Hoạt Động' },
    'nav.reviews': { en: 'Reviews', vi: 'Đánh Giá' },

    /* --- Footer --- */
    'footer.tag':       { en: 'One perfect cookie, delivered warm.', vi: 'Một chiếc bánh hoàn hảo, giao đến khi còn ấm.' },
    'footer.shop':      { en: 'Shop', vi: 'Cửa Hàng' },
    'footer.menu':      { en: 'Menu', vi: 'Thực Đơn' },
    'footer.order':     { en: 'Order Now', vi: 'Đặt Hàng' },
    'footer.yourOrder': { en: 'Your order', vi: 'Đơn Của Bạn' },
    'footer.visit':     { en: 'Visit', vi: 'Ghé Thăm' },
    'footer.locations': { en: 'Locations', vi: 'Địa Điểm' },
    'footer.contact':   { en: 'Contact', vi: 'Liên Hệ' },
    'footer.company':   { en: 'Company', vi: 'Công Ty' },
    'footer.about':     { en: 'About', vi: 'Giới Thiệu' },
    'footer.reviews':   { en: 'Reviews', vi: 'Đánh Giá' },
    'footer.copyright': { en: '© 2026 KUKI. Baked with intent.', vi: '© 2026 KUKI. Nướng bằng tâm huyết.' },

    /* --- Marquee (decorative) --- */
    'marquee.text': {
      en: 'Brown Butter&ensp;·&ensp;Small Batch&ensp;·&ensp;Real Chocolate&ensp;·&ensp;Baked Daily&ensp;·&ensp;Delivered Warm&ensp;·&ensp;',
      vi: 'Bơ Nâu&ensp;·&ensp;Mẻ Nhỏ&ensp;·&ensp;Sô-cô-la Thật&ensp;·&ensp;Nướng Mỗi Ngày&ensp;·&ensp;Giao Khi Còn Ấm&ensp;·&ensp;',
    },

    /* --- Hero --- */
    'hero.eyebrow':  { en: 'Small-batch cookie studio', vi: 'Xưởng bánh mẻ nhỏ' },
    'hero.heading':  { en: 'Fresh-baked cookies delivered&nbsp;warm.', vi: 'Bánh nướng tươi giao đến khi còn&nbsp;ấm.' },
    'hero.sub':      { en: 'Small batch. Brown butter. Real chocolate.', vi: 'Mẻ nhỏ. Bơ nâu. Sô-cô-la thật.' },
    'hero.viewMenu': { en: 'View Menu', vi: 'Xem Thực Đơn' },
    'hero.imgAlt':   { en: 'Close-up of a KUKI chocolate chip cookie with melted dark chocolate', vi: 'Cận cảnh chiếc bánh quy sô-cô-la KUKI với sô-cô-la đen tan chảy' },

    /* --- Why KUKI --- */
    'why.eyebrow':   { en: 'Why KUKI', vi: 'Vì Sao KUKI' },
    'why.heading':   { en: 'Obsessed with the details that matter.', vi: 'Tỉ mỉ với từng chi tiết quan trọng.' },
    'why.p1.title':  { en: 'Brown Butter', vi: 'Bơ Nâu' },
    'why.p1.body':   { en: "Every batch starts with butter browned slowly until it's deep, nutty, and toffee-sweet. It changes everything.", vi: 'Mỗi mẻ bắt đầu với bơ được đun chậm đến khi đậm đà, thơm bùi và ngọt như kẹo bơ. Nó thay đổi tất cả.' },
    'why.p2.title':  { en: 'Premium Chocolate', vi: 'Sô-cô-la Thượng Hạng' },
    'why.p2.body':   { en: 'Hand-chopped 55% dark Belgian chocolate — never chips — so every bite pulls into ribbons of real melt.', vi: 'Sô-cô-la đen Bỉ 55% thái tay — không bao giờ dùng chip — để mỗi miếng cắn kéo thành dải sô-cô-la tan chảy thật.' },
    'why.p3.title':  { en: 'Baked Fresh Daily', vi: 'Nướng Tươi Mỗi Ngày' },
    'why.p3.body':   { en: 'Nothing sits on a shelf. Your order goes into the oven after you place it and out the door within hours.', vi: 'Không có gì nằm trên kệ. Đơn của bạn vào lò ngay sau khi đặt và ra cửa trong vài giờ.' },

    /* --- Signature cookie --- */
    'sig.eyebrow': { en: 'The Signature', vi: 'Bánh Đặc Trưng' },
    'sig.heading': { en: 'The cookie that started it all.', vi: 'Chiếc bánh khởi đầu tất cả.' },
    'sig.desc':    { en: 'A crisp, caramelized edge giving way to a soft, molten center. One recipe, two hundred test batches, zero shortcuts.', vi: 'Viền bánh giòn, caramel hóa, nhường chỗ cho phần nhân mềm tan chảy. Một công thức, hai trăm mẻ thử nghiệm, không đi đường tắt.' },
    'sig.check1':  { en: 'Brown butter, never plain', vi: 'Bơ nâu, không bao giờ bơ thường' },
    'sig.check2':  { en: '55% dark Belgian chocolate', vi: 'Sô-cô-la đen Bỉ 55%' },
    'sig.check3':  { en: 'Flaky sea salt finish', vi: 'Hoàn thiện với muối biển hạt' },
    'sig.check4':  { en: 'Baked to order, never stocked', vi: 'Nướng theo đơn, không để sẵn' },

    /* --- Toffee cookie --- */
    'toffee.eyebrow': { en: 'Chocolate Chip + Toffee', vi: 'Sô-cô-la Chip + Kẹo Bơ' },
    'toffee.heading': { en: 'Our second obsession.', vi: 'Niềm đam mê thứ hai của chúng tôi.' },
    'toffee.desc':    { en: 'The Signature, reimagined with shards of buttery toffee folded through. Caramelized crunch in every bite, the same molten center underneath.', vi: 'Bánh Đặc Trưng được tái tạo với những mảnh kẹo bơ giòn xen kẽ. Độ giòn caramel trong mỗi miếng cắn, vẫn phần nhân tan chảy bên dưới.' },
    'toffee.check1':  { en: 'House-made buttery toffee', vi: 'Kẹo bơ tự làm' },
    'toffee.check3':  { en: 'Brown butter base', vi: 'Nền bơ nâu' },

    /* --- Cookie detail pages --- */
    'title.cookieSig':       { en: 'Brown Butter Chocolate Chip — KUKI', vi: 'Sô-cô-la Chip Bơ Nâu — KUKI' },
    'title.cookieToffee':    { en: 'Toffee Crunch — KUKI', vi: 'Kẹo Bơ Giòn — KUKI' },
    'cookiepg.back':         { en: 'Menu', vi: 'Thực Đơn' },
    'cookiepg.viewMenu':     { en: 'View full menu', vi: 'Xem toàn bộ thực đơn' },
    'cookiepg.craveEyebrow': { en: 'Still hungry?', vi: 'Vẫn còn thèm?' },
    'cookiepg.craveHeading': { en: 'Two cookies. One obsession.', vi: 'Hai chiếc bánh. Một niềm đam mê.' },
    'cookiepg.craveBody':    { en: 'Add the other one to your box — or build a mixed dozen.', vi: 'Thêm chiếc còn lại vào hộp — hoặc tạo một tá pha trộn.' },
    'cookiepg.toToffee':     { en: 'Meet the Toffee Crunch', vi: 'Khám phá Kẹo Bơ Giòn' },
    'cookiepg.toSignature':  { en: 'Meet the Signature', vi: 'Khám phá Bánh Đặc Trưng' },

    /* --- Pack selector / add to cart (HTML + script.js) --- */
    'pack.legend': { en: 'Choose how many', vi: 'Chọn số lượng' },
    'pack.single': { en: 'Single', vi: 'Đơn' },
    'cart.add':       { en: 'Add to Cart', vi: 'Thêm Vào Giỏ' },
    'cart.addQty':    { en: 'Add {qty} · {price}', vi: 'Thêm {qty} · {price}' },
    'cart.added':     { en: 'Added', vi: 'Đã Thêm' },
    'price.single':   { en: '{price} <span>— single</span>', vi: '{price} <span>— đơn</span>' },
    'price.multiple': { en: '{price} <span>— {qty} cookies</span>', vi: '{price} <span>— {qty} bánh</span>' },

    /* --- How It Works --- */
    'how.eyebrow':  { en: 'How It Works', vi: 'Cách Hoạt Động' },
    'how.heading':  { en: 'Warm cookies in three steps.', vi: 'Bánh ấm chỉ với ba bước.' },
    'how.s1.title': { en: 'Order Online', vi: 'Đặt Hàng Trực Tuyến' },
    'how.s1.body':  { en: 'Pick your box and check out in under a minute.', vi: 'Chọn hộp của bạn và thanh toán trong chưa đầy một phút.' },
    'how.s2.title': { en: 'We Bake Fresh', vi: 'Chúng Tôi Nướng Tươi' },
    'how.s2.body':  { en: 'Your cookies go into the oven the moment you order.', vi: 'Bánh của bạn vào lò ngay khoảnh khắc bạn đặt.' },
    'how.s3.title': { en: 'Delivered Warm', vi: 'Giao Đến Khi Còn Ấm' },
    'how.s3.body':  { en: 'At your door while the chocolate is still melted.', vi: 'Đến cửa nhà bạn khi sô-cô-la vẫn còn tan chảy.' },

    /* --- Reviews --- */
    'reviews.eyebrow': { en: 'Reviews', vi: 'Đánh Giá' },
    'reviews.heading': { en: "People don't just like these cookies.", vi: 'Mọi người không chỉ thích những chiếc bánh này.' },
    'reviews.r1.quote': { en: '"It was still warm when it hit my door. Crisp edge, molten center — I genuinely didn\'t know delivery cookies could do this."', vi: '"Bánh vẫn còn ấm khi đến cửa nhà tôi. Viền giòn, nhân tan chảy — thật sự tôi không biết bánh giao tận nơi lại làm được điều này."' },
    'reviews.r1.meta':  { en: 'Verified order · Austin, TX', vi: 'Đơn đã xác minh · Austin, TX' },
    'reviews.r2.quote': { en: '"The brown butter is not a gimmick. It tastes like toffee and toast in the best way. Nothing else compares now."', vi: '"Bơ nâu không phải chiêu trò. Nó có vị như kẹo bơ và bánh mì nướng theo cách tuyệt nhất. Giờ chẳng gì sánh được."' },
    'reviews.r2.meta':  { en: 'Verified order · Brooklyn, NY', vi: 'Đơn đã xác minh · Brooklyn, NY' },
    'reviews.r3.quote': { en: '"Texture is unreal — shattering edges, a center like chocolate lava. I ordered a second box before finishing the first."', vi: '"Kết cấu không tưởng — viền vỡ giòn tan, nhân như dung nham sô-cô-la. Tôi đặt hộp thứ hai trước cả khi ăn hết hộp đầu."' },
    'reviews.r3.meta':  { en: 'Verified order · Seattle, WA', vi: 'Đơn đã xác minh · Seattle, WA' },

    /* --- Our Story --- */
    'story.eyebrow': { en: 'Our Story', vi: 'Câu Chuyện Của Chúng Tôi' },
    'story.heading': { en: 'One cookie worth obsessing over.', vi: 'Một chiếc bánh đáng để say mê.' },
    'story.lede':    { en: 'KUKI started with a simple idea: create one cookie worth obsessing over.', vi: 'KUKI bắt đầu từ một ý tưởng đơn giản: tạo ra một chiếc bánh đáng để say mê.' },
    'story.body':    { en: 'No sprawling menu. No seasonal gimmicks. Just one recipe, refined batch after batch until every detail — the butter, the chocolate, the salt, the timing — earned its place.', vi: 'Không thực đơn dài dòng. Không chiêu trò theo mùa. Chỉ một công thức, tinh chỉnh qua từng mẻ cho đến khi mọi chi tiết — bơ, sô-cô-la, muối, thời gian — đều xứng đáng có mặt.' },
    'story.stat1':   { en: 'test batches', vi: 'mẻ thử nghiệm' },
    'story.stat2':   { en: 'ingredients that matter', vi: 'nguyên liệu quan trọng' },
    'story.stat3':   { en: 'perfect cookie', vi: 'chiếc bánh hoàn hảo' },

    /* --- Final CTA --- */
    'cta.heading': { en: 'One more cookie<span class="final-cta__dot">.</span>', vi: 'Thêm một chiếc bánh<span class="final-cta__dot">.</span>' },
    'cta.sub':     { en: 'Baked when you order. Warm when it arrives.', vi: 'Nướng khi bạn đặt. Ấm khi đến nơi.' },
    'cta.learnMore': { en: 'Learn More', vi: 'Tìm Hiểu Thêm' },

    /* --- Order page --- */
    'order.eyebrow':    { en: 'Start here', vi: 'Bắt đầu tại đây' },
    'order.title':      { en: 'Start an Order', vi: 'Bắt Đầu Đặt Hàng' },
    'order.delivery':   { en: 'Delivery', vi: 'Giao Hàng' },
    'order.pickup':     { en: 'Pickup', vi: 'Tự Đến Lấy' },
    'order.giftcards':  { en: 'Digital Gift Cards', vi: 'Thẻ Quà Tặng Điện Tử' },
    'order.catering':   { en: 'Catering', vi: 'Đặt Tiệc' },
    'order.comingSoon': { en: 'Coming soon', vi: 'Sắp ra mắt' },

    /* --- Menu page (order/menu.html) --- */
    'title.menu':       { en: 'The Menu — KUKI', vi: 'Thực Đơn — KUKI' },
    'menu.eyebrow':     { en: 'The Menu', vi: 'Thực Đơn' },
    'menu.heading':     { en: 'Build your box.', vi: 'Tạo hộp của bạn.' },
    'menu.sub':         { en: "Every cookie is baked to order and delivered warm. Choose a pack size, add it to your box, and check out when you're ready.", vi: 'Mỗi chiếc bánh được nướng theo đơn và giao đến khi còn ấm. Chọn kích cỡ gói, thêm vào hộp, và thanh toán khi bạn sẵn sàng.' },
    'menu.modeAria':    { en: 'How would you like your order?', vi: 'Bạn muốn nhận đơn như thế nào?' },
    'menu.qtyAria':     { en: 'How many cookies', vi: 'Số lượng bánh' },
    'menu.noteDelivery':{ en: 'Delivered warm. Free delivery on orders over {amount}.', vi: 'Giao đến khi còn ấm. Miễn phí giao cho đơn trên {amount}.' },
    'menu.notePickup':  { en: 'Ready warm at our studio — no delivery fee.', vi: 'Sẵn sàng còn ấm tại xưởng của chúng tôi — không phí giao hàng.' },
    'menu.sigName':     { en: 'Brown Butter Chocolate Chip', vi: 'Sô-cô-la Chip Bơ Nâu' },
    'menu.sigDesc':     { en: 'A crisp, caramelized edge giving way to a soft, molten center. Brown butter, 55% dark Belgian chocolate, flaky sea salt.', vi: 'Viền giòn caramel hóa nhường chỗ cho phần nhân mềm tan chảy. Bơ nâu, sô-cô-la đen Bỉ 55%, muối biển hạt.' },
    'menu.toffeeName':  { en: 'Toffee Crunch', vi: 'Kẹo Bơ Giòn' },
    'menu.toffeeDesc':  { en: 'The Signature reimagined with shards of house-made buttery toffee folded through. Caramelized crunch, the same molten center underneath.', vi: 'Bánh Đặc Trưng được tái tạo với những mảnh kẹo bơ tự làm xen kẽ. Độ giòn caramel, vẫn phần nhân tan chảy bên dưới.' },
    'menu.extrasTitle': { en: 'Make it a moment.', vi: 'Biến nó thành khoảnh khắc.' },
    'menu.extrasSub':   { en: 'A few extras worth adding to the box.', vi: 'Vài món thêm đáng để cho vào hộp.' },

    /* --- Sign In page --- */
    'signin.title':     { en: 'Sign In', vi: 'Đăng Nhập' },
    'signin.subtitle':  { en: "We'll text you a confirmation code to get started.", vi: 'Chúng tôi sẽ nhắn mã xác nhận để bạn bắt đầu.' },
    'signin.name':      { en: 'First & Last Name', vi: 'Họ và Tên' },
    'signin.phone':     { en: 'Mobile Phone Number', vi: 'Số Điện Thoại Di Động' },
    'signin.submit':    { en: 'Send Confirmation Code', vi: 'Gửi Mã Xác Nhận' },
    'signin.sent':      { en: 'Code Sent', vi: 'Đã Gửi Mã' },
    'signin.fineprint': {
      en: 'By proceeding you agree to our <a href="#">Terms and Conditions</a> and confirm you have read and understand our <a href="#">Privacy policy</a>.',
      vi: 'Bằng việc tiếp tục, bạn đồng ý với <a href="#">Điều khoản và Điều kiện</a> của chúng tôi và xác nhận đã đọc và hiểu <a href="#">Chính sách bảo mật</a>.',
    },
    'signin.errName':  { en: 'Please enter your first and last name.', vi: 'Vui lòng nhập họ và tên của bạn.' },
    'signin.errPhone': { en: 'Please enter a valid mobile phone number.', vi: 'Vui lòng nhập số điện thoại di động hợp lệ.' },
    'signin.codeSent': { en: 'Confirmation code sent to {phone}. (Demo — no SMS is actually sent.)', vi: 'Mã xác nhận đã gửi đến {phone}. (Bản demo — không có tin nhắn nào thực sự được gửi.)' },

    /* --- Checkout page (static) --- */
    'checkout.eyebrow':  { en: 'Your order', vi: 'Đơn Của Bạn' },
    'checkout.heading':  { en: 'Review your box.', vi: 'Kiểm tra hộp của bạn.' },
    'checkout.sub':      { en: 'Baked to order the moment you proceed — warm at your door, not off a shelf.', vi: 'Nướng theo đơn ngay khi bạn tiến hành — ấm nóng tại cửa nhà bạn, không phải lấy từ kệ.' },
    'checkout.addonHead':{ en: 'Make it a moment', vi: 'Biến nó thành khoảnh khắc' },
    'checkout.addonSub': { en: 'App-exclusive this month — gone when the batch runs out.', vi: 'Độc quyền trên ứng dụng tháng này — hết khi mẻ bánh hết.' },
    'checkout.summary':  { en: 'Order summary', vi: 'Tóm Tắt Đơn Hàng' },
    'checkout.subtotal': { en: 'Subtotal', vi: 'Tạm tính' },
    'checkout.discount': { en: 'Discount', vi: 'Giảm giá' },
    'checkout.tax':      { en: 'Tax', vi: 'Thuế' },
    'checkout.total':    { en: 'Total', vi: 'Tổng cộng' },
    'checkout.promoLabel':{ en: 'Promo or Dough code', vi: 'Mã khuyến mãi hoặc Dough' },
    'checkout.promoPlaceholder': { en: 'e.g. WARM10', vi: 'vd: WARM10' },
    'checkout.apply':    { en: 'Apply', vi: 'Áp Dụng' },
    'checkout.backMenu': { en: '← Back to menu', vi: '← Về thực đơn' },
    'checkout.proceed':  { en: 'Proceed', vi: 'Tiến Hành' },
    'checkout.secure':   { en: '🔒 Secure checkout · no card stored', vi: '🔒 Thanh toán an toàn · không lưu thẻ' },
    'checkout.orderPlaced':  { en: 'Order placed', vi: 'Đã Đặt Hàng' },
    'checkout.confirmHead':  { en: 'Your batch is going in the oven 🍪', vi: 'Mẻ bánh của bạn đang vào lò 🍪' },
    'checkout.confirmSub':   { en: 'Fresh-baked now — <strong id="confirm-eta">warm at your door soon</strong>.', vi: 'Nướng tươi ngay — <strong id="confirm-eta">sớm ấm nóng tại cửa nhà bạn</strong>.' },
    'checkout.orderTotal':   { en: 'Order total', vi: 'Tổng đơn hàng' },
    'checkout.doughEarned':  { en: 'Dough earned', vi: 'Dough kiếm được' },
    'checkout.backHome':     { en: 'Back to home', vi: 'Về trang chủ' },

    /* --- Checkout / cart (dynamic, JS) --- */
    'co.delivery':       { en: 'Delivery', vi: 'Giao Hàng' },
    'co.pickup':         { en: 'Pickup', vi: 'Tự Đến Lấy' },
    'co.free':           { en: 'Free', vi: 'Miễn phí' },
    'co.each':           { en: '{price} each', vi: '{price} mỗi cái' },
    'co.remove':         { en: 'Remove', vi: 'Xóa' },
    'co.add':            { en: 'Add', vi: 'Thêm' },
    'co.discountCode':   { en: 'Discount ({code})', vi: 'Giảm giá ({code})' },
    'co.etaPickup':      { en: 'Ready for pickup by ~{time}', vi: 'Sẵn sàng để lấy lúc ~{time}' },
    'co.etaDelivery':    { en: 'Warm at your door by ~{time}', vi: 'Ấm nóng tại cửa nhà bạn lúc ~{time}' },
    'co.earnDough':      { en: "You'll earn <strong>{n}</strong> Dough on this order.", vi: 'Bạn sẽ kiếm được <strong>{n}</strong> Dough cho đơn này.' },
    'co.promoTry':       { en: 'Try WARM10, FREESHIP, or DOUGH5.', vi: 'Thử WARM10, FREESHIP, hoặc DOUGH5.' },
    'co.promoApplied':   { en: 'Applied <strong>{code}</strong> — {label}. <button type="button" class="promo__remove" data-action="clear-promo">Remove</button>', vi: 'Đã áp dụng <strong>{code}</strong> — {label}. <button type="button" class="promo__remove" data-action="clear-promo">Xóa</button>' },
    'co.promoInvalid':   { en: '“{code}” isn\'t a valid code.', vi: '“{code}” không phải mã hợp lệ.' },

    /* Delivery progress bar */
    'co.barPickupCheckout': { en: 'Pickup selected — no delivery fee.', vi: 'Đã chọn tự lấy — không phí giao hàng.' },
    'co.barPickupDrawer':   { en: 'Pickup — ready warm, no delivery fee.', vi: 'Tự lấy — sẵn sàng còn ấm, không phí giao hàng.' },
    'co.barUnlocked':       { en: 'You’ve unlocked free delivery 🎉', vi: 'Bạn đã mở khóa giao hàng miễn phí 🎉' },
    'co.barProgress':       { en: 'Add <strong>{amount}</strong> more for free delivery', vi: 'Thêm <strong>{amount}</strong> nữa để được giao miễn phí' },

    /* Cart drawer */
    'drawer.title':     { en: 'Your box', vi: 'Hộp Của Bạn' },
    'drawer.empty':     { en: 'Your box is empty', vi: 'Hộp của bạn đang trống' },
    'drawer.emptySub':  { en: 'Warm, brown-butter cookies are one tap away.', vi: 'Bánh bơ nâu ấm nóng chỉ cách một chạm.' },
    'drawer.browse':    { en: 'Browse the menu', vi: 'Xem thực đơn' },
    'drawer.checkout':  { en: 'Checkout · {price}', vi: 'Thanh toán · {price}' },
    'drawer.note':      { en: 'Taxes & delivery calculated at checkout.', vi: 'Thuế & phí giao hàng được tính khi thanh toán.' },
    'drawer.openCart':  { en: 'Open your cart', vi: 'Mở giỏ hàng của bạn' },
    'drawer.closeCart': { en: 'Close cart', vi: 'Đóng giỏ hàng' },
    'drawer.ariaCart':  { en: 'Your cart', vi: 'Giỏ hàng của bạn' },
    'drawer.itemsInCart': { en: '{n} item(s) in cart', vi: '{n} sản phẩm trong giỏ' },

    /* --- Promo labels (cart.js PROMOS) --- */
    'promo.WARM10':   { en: '10% off', vi: 'Giảm 10%' },
    'promo.FREESHIP': { en: 'Free delivery', vi: 'Miễn phí giao hàng' },
    'promo.DOUGH5':   { en: '100.000 ₫ Dough credit', vi: 'Tín dụng Dough 100.000 ₫' },

    /* --- Product catalog (cart.js CATALOG) --- */
    'product.signature.name':    { en: 'The Signature', vi: 'Bánh Đặc Trưng' },
    'product.signature.variant': { en: 'Single cookie', vi: 'Bánh đơn' },
    'product.toffee.name':       { en: 'Chocolate Chip + Toffee', vi: 'Sô-cô-la Chip + Kẹo Bơ' },
    'product.toffee.variant':    { en: 'Single cookie', vi: 'Bánh đơn' },
    'product.box6.name':         { en: 'Half Dozen', vi: 'Nửa Tá' },
    'product.box6.variant':      { en: 'Box of 6', vi: 'Hộp 6 cái' },
    'product.box12.name':        { en: "Baker's Dozen", vi: 'Tá Của Thợ Bánh' },
    'product.box12.variant':     { en: 'Box of 12', vi: 'Hộp 12 cái' },
    'product.drop.name':         { en: 'Brown Butter Miso', vi: 'Bơ Nâu Miso' },
    'product.drop.variant':      { en: 'June Drop', vi: 'Phiên Bản Tháng Sáu' },
    'product.drop.blurb':        { en: 'This month only. Salted brown-butter dough, white miso, dark chocolate.', vi: 'Chỉ tháng này. Bột bơ nâu mặn, miso trắng, sô-cô-la đen.' },
    'product.milk.name':         { en: 'Cold Oat Milk', vi: 'Sữa Yến Mạch Lạnh' },
    'product.milk.variant':      { en: 'Pairing', vi: 'Đồ uống kèm' },
    'product.milk.blurb':        { en: 'Ice-cold, in a glass bottle. The only correct partner.', vi: 'Lạnh buốt, trong chai thủy tinh. Người bạn đồng hành duy nhất đúng đắn.' },
  };

  /* ---- State ------------------------------------------------- */
  let lang = load();

  function load() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && SUPPORTED.indexOf(v) !== -1) return v;
    } catch (e) { /* storage off */ }
    return DEFAULT;
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage off */ }
  }

  /* ---- Translate --------------------------------------------
     t(key)                  → translated string (or the key if unknown)
     t(key, vars)            → with {placeholder} interpolation
     t(key, vars, fallback)  → use `fallback` when the key is unknown,
                               so callers can pass an English default
                               (e.g. catalog data) without leaking keys. */
  function t(key, vars, fallback) {
    const entry = DICT[key];
    let s = entry
      ? (entry[lang] != null ? entry[lang] : entry.en)
      : (fallback != null ? fallback : key);
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
    }
    return s;
  }

  /* ---- Pub/sub for dynamic re-renders ----------------------- */
  const subs = new Set();
  function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }

  /* ---- Apply translations to the DOM ------------------------ */
  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = t(el.getAttribute('data-i18n'));
      if (el.textContent !== val) el.textContent = val;
    });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.lang = lang;
  }

  /* ---- Language switching ----------------------------------- */
  function setLang(next) {
    if (SUPPORTED.indexOf(next) === -1 || next === lang) return;
    lang = next;
    persist();
    apply(document);
    refreshToggles();
    subs.forEach((fn) => { try { fn(lang); } catch (e) { /* keep going */ } });
  }
  function toggle() { setLang(lang === 'en' ? 'vi' : 'en'); }

  /* ---- The top-right toggle button --------------------------
     One compact control on every page. Where a nav exists it sits
     in the right-hand actions cluster; the standalone Sign In page
     gets a floating button pinned to the top-right corner. */
  const GLOBE =
    '<svg class="lang-toggle__globe" width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M2.5 10h15M10 2.5c2.2 2 3.4 4.7 3.4 7.5S12.2 15.5 10 17.5C7.8 15.5 6.6 12.8 6.6 10S7.8 4.5 10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '</svg>';

  const toggles = [];

  function makeToggle(extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle' + (extraClass ? ' ' + extraClass : '');
    btn.innerHTML = GLOBE + '<span class="lang-toggle__code"></span>';
    btn.addEventListener('click', toggle);
    toggles.push(btn);
    return btn;
  }

  function refreshToggles() {
    const code = lang === 'en' ? 'EN' : 'VI';
    const label = lang === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang Tiếng Anh';
    toggles.forEach((btn) => {
      const codeEl = btn.querySelector('.lang-toggle__code');
      if (codeEl) codeEl.textContent = code;
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }

  function mountToggle() {
    const actions = document.querySelector('.nav__actions');
    if (actions) {
      // First item in the right cluster, so it reads as top-right.
      actions.insertBefore(makeToggle(), actions.firstChild);
    } else {
      // Pages with no nav (sign in): float it in the corner.
      makeToggle('lang-toggle--floating');
      document.body.appendChild(toggles[toggles.length - 1]);
    }
    refreshToggles();
  }

  /* ---- Public API ------------------------------------------- */
  window.KukiI18n = {
    get lang() { return lang; },
    SUPPORTED,
    t,
    setLang,
    toggle,
    onChange,
    apply,
  };

  /* ---- Boot --------------------------------------------------
     Deferred scripts run after the document is parsed, so the DOM
     is ready here — apply immediately, before cart/checkout render. */
  apply(document);
  mountToggle();
})();
