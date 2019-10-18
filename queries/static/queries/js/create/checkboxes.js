const Checkboxes = {

  getElements(parentElem, values) {
    if (values === 'all') {
      return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'));
    } else {
      values = values.map(String);
      return (
        Array.from(parentElem.querySelectorAll('input[type="checkbox"]'))
          .filter(checkbox => values.includes(checkbox.value))
      );
    }
  },

  show(parentElem, values = 'all') {
    this.getElements(parentElem, values).forEach(checkbox => {
      checkbox.closest('li').hidden = false;
    });
  },

  showAndSelect(parentElem, values = 'all') {
    this.getElements(parentElem, values).forEach(checkbox => {
      checkbox.closest('li').hidden = false;
      checkbox.checked = true;
    });
  },

  hide(parentElem, values = 'all') {
    this.getElements(parentElem, values).forEach(checkbox => {
      checkbox.closest('li').hidden = true;
      checkbox.checked = false;
    });
  },

};

export default Checkboxes;