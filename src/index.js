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

function createDom(fiber){
  const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

  const isProperty = key => key !== 'children';

  Object.keys(fiber.props)
  .filter(isProperty)
  .forEach(name => {
    dom[name] = fiber.props[name]
  })

  return dom;
}




let nextUnitOfWork = null;
let wipRoot = null;

function commitRoot(){
  commitWork(wipRoot.child)
}


function commitWork(fiber){
  if(!fiber){
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

const render = (element, container)=>{
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  }
  nextUnitOfWork = wipRoot;

  function performUnitOfWork(fiber){
    // TODO add dom node
    if( !fiber.dom){
      fiber.dom = createDom(fiber);
    }

    // if(fiber.parent){
    //   fiber.parent.dom.appendChild(fiber.dom)
    // }
    

    // TODO create new fibers
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;

    while(index < elements.length){
      const element = elements[index];

      const newFiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
      }

      if(index === 0){
        fiber.child = newFiber;
      }else{
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index ++;
    }

    // TODO return next unit of work
    if(fiber.child){
      return fiber.child
    }
    let nextFiber = fiber;
    while(nextFiber){
      if(nextFiber.sibling){
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
    
  }

  function workLoop(deadline){
    let shouldYield = false;
    while( nextUnitOfWork && !shouldYield){
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      console.log('working nextUnitOfWork', nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1
    }

    if(!nextUnitOfWork && wipRoot){
      commitRoot();
    }
    requestIdleCallback(workLoop);
  }

    
  requestIdleCallback(workLoop);
}



const Didact = {
  createElement,
  render,
}

const element = (
  <div id="foo" className="red">
    <a>bar</a>
    <b />
  </div>
)

Didact.render(element, document.getElementById('app'))