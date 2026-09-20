// Token thiet ke cho Ant Design, dong bo voi index.css
export const antdTheme = {
  token: {
    colorPrimary: '#0d7a3e',
    colorSuccess: '#0d7a3e',
    colorError:   '#9e0a0a',
    colorLink:    '#211922',

    colorText:          '#33332e',
    colorTextSecondary: '#62625b',
    colorTextTertiary:  '#91918c',

    colorBorder:          '#dadad3',
    colorBorderSecondary: '#e5e5e0',
    colorBgLayout:        '#fbfbf9',
    colorBgContainer:     '#ffffff',

    borderRadius:   16,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 16,
    controlHeight: 40,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg:   '#fbfbf9',
      footerBg: '#ffffff',
      headerHeight: 64,
    },
    Table: {
      headerBg:    '#f6f6f3',
      borderColor: '#e5e5e0',
      rowHoverBg:  '#fbfbf9',
    },
    Input: { controlHeight: 44 },
    Menu:  { itemBg: 'transparent' },
  },
}