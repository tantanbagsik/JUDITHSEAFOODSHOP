/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native' {
  interface FlatListProps<T> {
    contentContainerClassName?: string;
    columnWrapperClassName?: string;
  }
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
}
