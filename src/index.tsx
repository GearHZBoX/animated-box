import React, { useCallback, useEffect, useRef, CSSProperties, FC, PropsWithChildren } from "react"
import { useSprings, animated, useSpringValue, UseSpringsProps } from '@react-spring/web';
import './index.css';

function getRowCount(width, itemWidth, gap) {
  if(width <= itemWidth) {
    return 1;
  }
  const avgItemWidth = itemWidth + gap;
  const roughCount = Math.floor(width / avgItemWidth);        
  if ((roughCount + 1) * itemWidth + (roughCount) * gap <= width) {
    return roughCount + 1;
  } 
  return roughCount;
}

interface IProps {
  itemWidth: number;
  itemHeight: number;
  className?: string;
  style?: CSSProperties;
  columnGap?: number;
  rowGap?: number;
  padding?: number
  springAdaption?: UseSpringsProps;
  staticLaunch?: boolean;
  interval?: number;
}


const AnimatedBox: FC<PropsWithChildren<IProps>> = ({ children, itemWidth, itemHeight, className, style, columnGap = 0, rowGap = 0, padding = 0, springAdaption, staticLaunch = true, interval = 0 }) => {
  const boxRef = useRef<HTMLDivElement>(null);

  const layoutInitFlag = useRef(false);

  const childrenLength = Array.isArray(children) ? children.length : 1;

  const _children = Array.isArray(children) ? children : [children];

  const getItemPos = useCallback(()=> {
    const boxWidth = boxRef.current?.offsetWidth;
    const innerWidth = boxWidth! - 2 * padding;
    const countPerRow = getRowCount(innerWidth, itemWidth, columnGap);

    const posList: any[] = [];
    posList.length = childrenLength;
    posList.fill(1);
    posList.forEach((_value, index) => {
      const rowNo = Math.floor(index  / countPerRow);
      const columnNo = index - rowNo * countPerRow;
      const x = columnNo * itemWidth + columnNo * columnGap + padding;
      const y = rowNo * itemHeight + rowNo * rowGap + padding;
      posList[index] = [x, y];
    });
    return posList;
  }, [padding, rowGap, columnGap, childrenLength, itemWidth, itemHeight]);

  const [springs, api] = useSprings(childrenLength, i => ({
    x: 0,
    y: 0,
    ...springAdaption,
  }), []);

  const containerHeight = useSpringValue(0);

  useEffect(() => {
    let lastBoxWidth = boxRef.current?.offsetWidth;
    const handler = () => {

      const isStaticLaunch = staticLaunch && !lastBoxWidth;

      const posList = getItemPos();
      api.start(i => ({
        x: posList[i][0],
        y: posList[i][1],
        delay: (!layoutInitFlag.current || isStaticLaunch) ? 0 : (interval >= 0 ? i * interval : childrenLength * interval + i * interval),
        immediate: !layoutInitFlag.current || isStaticLaunch,
        ...springAdaption,
      }));
      layoutInitFlag.current = true;
      containerHeight.start(posList[posList.length - 1][1] + itemHeight + padding, { immediate: containerHeight.get() === 0 });
      lastBoxWidth = boxRef.current?.offsetWidth;
    }
    const observer = new ResizeObserver(handler);
    observer.observe(boxRef.current!);

    return () => observer.disconnect();
  }, [getItemPos, api, springAdaption, staticLaunch, childrenLength, interval]);


  return (
    <animated.div ref={boxRef} className={`animated-flex-container ${className || ''}`} style={{ ...style, height: containerHeight }}>
      {springs.map((spring, index) => (
        <animated.div className="item" style={{ ...spring, width: itemWidth, height: itemHeight, position: 'absolute' }} key={index}>
          {_children[index]}
        </animated.div>
      ))}
    </animated.div>
  );
}

export default AnimatedBox;