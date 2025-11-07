import React, { useEffect } from 'react';
import { Button, Card, Divider, Form, Input, message, Modal, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, SendOutlined, TagOutlined, WindowsOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import QueryKeys from '@renderer/constants/queryKeys';
import useBrowserInstanceManager from '@renderer/hooks/useBrowserInstanceManager';
import { BrowserInstance, BrowserInstanceMessage } from '@shared/types';
import { useApplicationInfo } from '@renderer/hooks/useApplicationInfo';

const DeleteBtn = ({ disabled, onConfirm }) => {
  return (
    <Popconfirm
      disabled={disabled}
      title="Delete instance"
      description="Are you sure to delete this instance?"
      onConfirm={onConfirm}
      okText="Delete"
      cancelText="Cancel"
    >
      <DeleteOutlined style={{ color: 'red' }} onClick={async () => {
      }} />
    </Popconfirm>
  );
};

const CallFunctionModal = ({ isOpen, instance, setIsOpen }) => {
  const { sessionId } = instance;
  const instanceManager = useBrowserInstanceManager();
  const callFunction = useMutation({
    mutationFn: async ({ sessionId, method, args }: { sessionId: string; method: string; args: any[] }) =>
      instanceManager.callInstanceFunction(sessionId, method, ...args),
    onError(error, variables, context) {
      console.log({ error, variables, context });
      message.error('Send message failed');
    },
  });

  return (
    <Modal
      title="Call Function"
      open={isOpen}
      cancelText="Close"
      onCancel={() => {
        setIsOpen(false);
      }}
    >
      <Form
        onFinish={(values) => {
          callFunction.mutate({ sessionId, method: values.method, args: [values.code] });
        }}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        autoComplete="off"
      >
        <Form.Item label="Method" name="method" rules={[{ required: true, message: 'Please input method!' }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Please input your code!' }]}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Execute
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const SetAttributesModal = ({ isOpen, instance, setIsOpen }) => {
  const [form] = Form.useForm();
  const instanceManager = useBrowserInstanceManager();
  const updateInstance = useMutation({
    mutationFn: ({ attributes }: { attributes: Record<string, string> }) =>
      instanceManager.updateInstance(
        instance.sessionId,
        { attributes },
        {
          restart: false,
          notifyToTransporter: true,
          notifyToRenderer: true,
        },
      ),
    onSuccess: () => {
      message.success('Update attributes success');
      setIsOpen(false);
    },
    onError(error, variables, context) {
      console.log({ error, variables, context });
      message.error('Update attributes failed');
    },
  });
  useEffect(() => {
    if (instance) {
      form.setFieldsValue({
        attributes: Object.entries(instance.attributes || {}).map(([key, value]) => ({ key, value })),
      });
    }
  }, [instance]);

  return (
    <Modal
      title={`${instance?.name} - Set Attributes`}
      open={isOpen}
      onOk={async () => {
        const values = form.getFieldsValue();
        const attributes = {};
        for (const { key, value } of values.attributes) {
          if (!key || !value) {
            message.error('Key and value are required');
            return;
          }
          attributes[key] = value;
        }
        updateInstance.mutate({ attributes });
      }}
      onCancel={() => setIsOpen(false)}
      width={700}
      okText="Save"
    >
      <Form form={form} layout="vertical" name="attributesForm">
        <Form.List name="attributes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space key={key} style={{ display: 'flex' }} align="baseline">
                  <Form.Item {...restField} name={[name, 'key']} rules={[{ required: true, message: 'Key required' }]}>
                    <Input placeholder="Key" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    rules={[{ required: true, message: 'Value required' }]}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                  <Button onClick={() => remove(index)} danger icon={<DeleteOutlined />} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Add Attribute
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default function BrowserInstanceComponent({
                                                   instance,
                                                   instanceMessage,
                                                 }: {
  instance: BrowserInstance;
  instanceMessage?: BrowserInstanceMessage;
}) {
  const { status, sessionId } = instance;

  const { isDebug } = useApplicationInfo();

  const instanceManager = useBrowserInstanceManager();

  const queryClient = useQueryClient();

  const deleteChannel = useMutation({
    mutationFn: instanceManager.deleteInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.GET_INSTANCES] });
    },
    onError(error, variables, context) {
      message.error('Delete instance failed');
    },
  });

  const startInstance = useMutation({
    mutationFn: instanceManager.startInstance,
    onSuccess: () => {
      message.success('Start instance success');
    },
    onError(error, variables, context) {
      message.error('Start instance failed');
    },
  });

  const startHeadlessInstance = useMutation({
    mutationFn: instanceManager.startInstanceHeadless,
    onSuccess: () => {
      message.success('Start instance headless success');
    },
    onError(error, variables, context) {
      message.error('Start instance headless failed');
    },
  });

  const stopInstance = useMutation({
    mutationFn: instanceManager.stopInstance,
    onSuccess: () => {
      message.success('Stop instance success');
    },
    onError(error, variables, context) {
      message.error('Stop instance failed');
    },
  });

  const [isCFModalOpen, setCFModalOpen] = React.useState(false);
  const [isSetAttributesModalOpen, setSetAttributesModalOpen] = React.useState(false);

  const actions = [];

  actions.push(
    <Tooltip title="attributes">
      <TagOutlined
        key="attributes"
        onClick={() => {
          setSetAttributesModalOpen(true);
        }}
      />
    </Tooltip>,
  );

  if (status === 'Running') {
    actions.push(
      <Tooltip title="stop">
        <PauseCircleOutlined
          style={{ color: 'orange' }}
          key="stop"
          onClick={() => {
            stopInstance.mutate(sessionId);
          }}
        />
      </Tooltip>,
    );
    actions.push(
      <Tooltip title="show window">
        <WindowsOutlined
          key="showWindow"
          onClick={() => {
            instanceManager.showInstanceWindow(sessionId);
          }}
        />
      </Tooltip>,
    );
    if (isDebug) {
      actions.push(
        <Tooltip title="call">
          <SendOutlined
            key="call"
            onClick={() => {
              setCFModalOpen(true);
            }}
          />
        </Tooltip>,
      );
    }
  } else if (status === 'Stopped') {
    actions.push(
      <Tooltip title="start">
        <PlayCircleOutlined
          style={{ color: 'green' }}
          key="start"
          onClick={() => {
            startInstance.mutate(sessionId);
          }}
        />
      </Tooltip>,
    );
    actions.push(
      <Tooltip title="start headless">
        <PlayCircleOutlined
          style={{ color: 'green' }}
          key="start_headless"
          onClick={() => {
            startHeadlessInstance.mutate(sessionId);
          }}
        />
      </Tooltip>,
    );
  }
  actions.push(
    <Tooltip title="delete">
      <DeleteBtn key="delete" disabled={deleteChannel.isPending} onConfirm={() => deleteChannel.mutate(sessionId)} />,
    </Tooltip>,
  );

  let statusColor = 'default';
  if (status === 'Running') {
    statusColor = 'green';
  } else if (status === 'Stopped') {
    statusColor = 'red';
  } else if (status === 'Starting' || status === 'Stopping') {
    statusColor = 'orange';
  }

  const renderInstanceMessage = () => {
    if (!instanceMessage || status !== 'Running') return null;
    return (
      <>
        <Divider />
        <div dangerouslySetInnerHTML={{ __html: instanceMessage.message }} />
      </>
    );
  };

  return (
    <Card actions={actions}>
      <Card.Meta
        title={<Tooltip title={sessionId}>{instance.name}</Tooltip>}
        description={
          <div>
            <div>
              <Tag color={statusColor}>{status}</Tag>
              <Tag color="blue">{instance.url}</Tag>
            </div>
            {renderInstanceMessage()}
          </div>
        }
      />
      <CallFunctionModal instance={instance} isOpen={isCFModalOpen} setIsOpen={setCFModalOpen} />
      <SetAttributesModal instance={instance} isOpen={isSetAttributesModalOpen} setIsOpen={setSetAttributesModalOpen} />
    </Card>
  );
}
