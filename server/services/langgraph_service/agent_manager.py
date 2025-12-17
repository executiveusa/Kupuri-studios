from typing import List, Dict, Any, Optional
from langchain_core.tools import BaseTool
from models.tool_model import ToolInfoJson
from .configs import BaseAgentConfig
from services.tool_service import tool_service


class AgentManager:
    """Agent Manager (Stub - Langgraph disabled for compatibility)"""

    @staticmethod
    def create_agents(
        model: Any,
        tool_list: List[ToolInfoJson],
        system_prompt: str = ""
    ) -> List[Any]:
        """Create agents (Stub - Langgraph disabled)"""
        # For now, return empty list - langgraph service is disabled for compatibility
        return []

    @staticmethod
    def _create_langgraph_agent(
        model: Any,
        config: BaseAgentConfig
    ) -> Any:
        """Create single agent (Stub - Langgraph disabled)"""
        return None

    @staticmethod
    def get_last_active_agent(
        messages: List[Dict[str, Any]],
        agent_names: List[str]
    ) -> Optional[str]:
        """获取最后活跃的智能体

        Args:
            messages: 消息历史
            agent_names: 智能体名称列表

        Returns:
            Optional[str]: 最后活跃的智能体名称，如果没有则返回 None
        """
        for message in reversed(messages):
            if message.get('role') == 'assistant':
                message_name = message.get('name')
                if message_name and message_name in agent_names:
                    return message_name
        return None
