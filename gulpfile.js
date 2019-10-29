const gulp = require(`gulp`);
const del = require(`del`);
const plumber = require(`gulp-plumber`);
const concat = require(`gulp-concat`);
const rename = require(`gulp-rename`);

const sass = require(`gulp-sass`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const minify = require(`gulp-csso`);

const minifyJs = require(`gulp-terser`);

const server = require(`browser-sync`).create();

gulp.task(`clean`, function() {
  return del([`css`, `js`, `index.html`]);
});

gulp.task(`style`, function () {
  return gulp.src(`src/sass/style.scss`)
    .pipe(plumber())
    .pipe(sass({
      includePaths: require(`node-normalize-scss`).includePaths,
      outputStyle: `expanded`
    }))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(`css`))
    .pipe(minify())
    .pipe(rename(`style.min.css`))
    .pipe(gulp.dest(`css`))
    .pipe(server.stream());
});

gulp.task(`scripts`, function() {
  return gulp.src(`src/js/script.js`)
  .pipe(plumber())
  .pipe(gulp.dest(`js`))
  .pipe(minifyJs())
  .pipe(rename({
    suffix: `.min`
  }))
  .pipe(gulp.dest(`js`));
});

gulp.task(`html`, function () {
  return gulp.src(`src/*.html`)
    .pipe(gulp.dest(`./`));
});

gulp.task(`refresh`, function (done) {
  server.reload();
  done();
});

gulp.task(`build`, gulp.series(
  `clean`,
  `style`,
  `scripts`,
  `html`
));

gulp.task(`serve`, function () {
  server.init({
    server: `./`,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(`src/**/*.scss`, gulp.series(`style`));
  gulp.watch(`src/**/*.js`, gulp.series(`scripts`, `refresh`));
  gulp.watch(`src/**/*.html`, gulp.series(`html`, `refresh`));
});

gulp.task(`start`, gulp.series(`build`, `serve`));
