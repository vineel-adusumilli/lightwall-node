$(document).ready(function() {
  $(".record").click(function() {
    $("nav a div").fadeOut(100);
    $(".default").slideUp(300);
    $(".gocrazy").fadeIn(300);
  });

  $(".stop").click(function() {
    $(".default").slideDown(300);
    $(".gocrazy").fadeOut(300);
    $("nav a div").delay(200).fadeIn(100);
  });
});

