const createTextElement = (text)=>{
  debugger
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
let currentRoot = null;
let deletions = []; // 要删除的node

function commitRoot(){
  deletions.forEach(commitWork);
  commitWork(wipRoot.child)
  // currentRoot: 最后一次commit到DOM的一颗Fiber Tree
  currentRoot = wipRoot;
  wipRoot = null;
}


function commitWork(fiber){
  if(!fiber){
    return;
  }
  const domParent = fiber.parent.dom;

  if(fiber.effectTag === 'PLACEMENT' && fiber.dom !=null){
    domParent.appendChild(fiber.dom);
  }else if(fiber.effectTag === 'UPDATE' && fiber.dom !=null){
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }else if(fiber.effectTag === 'DELETION'){
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps){
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .fiber(isEvent)
    .fiber(key=>!(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name=>{
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })
  
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .fiter(isGone(prevProps, nextProps))
    .forEach(name=>{
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name=>{
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name=>{
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function reconcileChildren(wipFiber, elements){
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;


  while( index < elements.length || oldFiber !==null ){
    const element = elements[index];

    let newFiber = null;

    //  TODO compare oldFiber to element
    // 对于新旧element的处理
    const sameType = oldFiber && element && (element.type = oldFiber.type);

    // 如果老的Fiber和新的element拥有相同的type，我们可以保留DOM节点并仅使用新的Props进行更新。这里我们会创建新的Fiber来使DOM节点与旧的Fiber保持一致，而props与新的element保持一致。
    // 我们还向Fiber中添加了一个新的属性effectTag，这里的值为UPDATE。稍后我们将在commit阶段使用这个属性。
    if(sameType){
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }

    // 如果两者的type不一样并且有一个新的element，这意味着我们需要创建一个新的DOM节点
    // 在这种情况下，我们会用PLACEMENT effect tag来标记新的Fiber。
    if(element && !sameType){
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }

    if(oldFiber && !sameType){
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if(index === 0){
      wipFiber.child = newFiber;
    }else{
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++
  }

}

const render = (element, container)=>{
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot,
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
    reconcileChildren(fiber, element);

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