function irProductos(){

  document.getElementById("productos").scrollIntoView({
    behavior:"smooth"
  });

}

function toggleCategorias(){

  const menu = document.getElementById("dropdownCategorias");

  if(menu.style.display === "block"){
    menu.style.display = "none";
  }else{
    menu.style.display = "block";
  }

}