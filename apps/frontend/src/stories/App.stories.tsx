import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from '../App';

const meta = {
  title: 'App',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  loaders: [
    async () => {
      globalThis.fetch = async () =>
        new Response('Hello World!', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      return {};
    },
  ],
};
