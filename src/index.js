const createTextElement = (text)=>{
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

const createElement = (type, props, ...children)=>{
  return {
    type,
    props: {
      ...props,
      children: children.map(child=>{
        if(typeof child === 'object'){
          return child;
        }else{
          return createTextElement(child)
        }
      })
    }
  }
}

const render = (element, container)=>{
  const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode(""):document.createElement(element.type);

  const isProperty = key => key !== 'children';

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child=>{
    render(child, dom);
  })

  container.appendChild(dom);
}

const Didact = {
  createElement,
  render,
}

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

Didact.render(element, document.getElementById('app'))